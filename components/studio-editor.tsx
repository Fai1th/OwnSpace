"use client";
import {
  useEffect,
  useRef,
  useState,
  isValidElement,
  cloneElement,
  type ReactElement,
} from "react";
import Link from "next/link";
import { ChakraProvider, Input, Textarea, Button } from "@chakra-ui/react";
import { defaultSystem } from "@saas-ui/chakra-preset";
import { UserButton } from "@clerk/nextjs";
import {
  UserIcon,
  LinkSimpleIcon,
  PaletteIcon,
  ImageIcon,
  PlugsConnectedIcon,
  GearSixIcon,
  ArrowUpRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  DeviceMobileIcon,
  DesktopIcon,
  DownloadSimpleIcon,
  CheckIcon,
  GithubLogoIcon,
} from "@phosphor-icons/react";
import { Logo } from "./logo";
import { ProfileView } from "./profile-view";
import {
  emptyProfile,
  themes,
  profileSchema,
  normalizeHandle,
  type Profile,
  type ProfileRecord,
} from "@/lib/profile";
import { siteConfig } from "@/lib/config";
import { optimizeImage } from "@/lib/image-upload";
import { readDraft, reconcileSavedDraft } from "@/lib/draft";
type Panel = "about" | "links" | "appearance" | "images" | "connections" | "settings";
const panels: { id: Panel; name: string; icon: typeof UserIcon }[] = [
  { id: "about", name: "Your profile", icon: UserIcon },
  { id: "links", name: "Links", icon: LinkSimpleIcon },
  { id: "appearance", name: "Appearance", icon: PaletteIcon },
  { id: "images", name: "Image cards", icon: ImageIcon },
  { id: "connections", name: "Connections", icon: PlugsConnectedIcon },
  { id: "settings", name: "Settings", icon: GearSixIcon },
];
const DRAFT_KEY = "ownspace-draft-v1";
export function StudioEditor({ demo }: { demo: boolean }) {
  return (
    <ChakraProvider value={defaultSystem}>
      <Editor demo={demo} />
    </ChakraProvider>
  );
}
function Editor({ demo }: { demo: boolean }) {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [record, setRecord] = useState<ProfileRecord | null>(null);
  const [accountEntitlement, setAccountEntitlement] = useState("free");
  const entitlementRevision = useRef(0),
    verifiedEntitlement = useRef("free");
  function observeEntitlement(status: string, expectedRevision?: number) {
    if (expectedRevision !== undefined && expectedRevision !== entitlementRevision.current)
      return verifiedEntitlement.current;
    verifiedEntitlement.current = status;
    entitlementRevision.current++;
    setAccountEntitlement(status);
    return status;
  }
  const [paymentPending, setPaymentPending] = useState(false);
  const [paymentChecking, setPaymentChecking] = useState(false);
  const [panel, setPanel] = useState<Panel>("about");
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(false);
  const [wide, setWide] = useState(false);
  const [github, setGithub] = useState<{
    configured: boolean;
    connected: boolean;
    repos: { id: number; title: string; url: string; description: string; stars: number }[];
  } | null>(null);
  const [deleteText, setDeleteText] = useState("");
  const baseline = useRef("");
  const dirty = JSON.stringify(profile) !== baseline.current;
  const dialog = useRef<HTMLDialogElement>(null);
  const premium = accountEntitlement === "paid";
  const linkLimit = premium ? 20 : 3;
  const imageLimit = premium ? 6 : 1;
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const query = new URLSearchParams(location.search);
        if (["upgrade", "settings"].includes(query.get("panel") || "")) setPanel("settings");
        if (query.has("github")) {
          setPanel("connections");
          if (!demo) void loadGithub();
        }
        if (query.has("purchase")) {
          const complete = query.get("purchase") === "complete";
          setPaymentPending(complete && !demo);
          setMessage(
            demo
              ? "Purchases are unavailable in this preview."
              : complete
                ? "Your purchase is being confirmed. Premium appears after payment verification."
                : "Checkout cancelled. Your page is still here.",
          );
        }
        let initial = { ...emptyProfile };
        let savedAccountPage = false;
        if (query.get("handle")) initial.handle = normalizeHandle(query.get("handle")!);
        if (themes.some((t) => t.id === query.get("template")))
          initial.theme = query.get("template") as Profile["theme"];
        if (demo) {
          try {
            const cached = localStorage.getItem(DRAFT_KEY);
            if (cached) {
              const parsed = readDraft(cached);
              if (parsed) initial = parsed;
            }
          } catch {}
        } else {
          const r = await fetch("/api/profile", { cache: "no-store" });
          const data = await r.json();
          if (!r.ok) throw Error(data.error);
          if (live) observeEntitlement(data.entitlement || data.profile?.entitlement || "free");
          if (data.profile) {
            savedAccountPage = true;
            initial = data.profile.draft;
            if (live) setRecord(data.profile);
          } else {
            try {
              const local = readDraft(localStorage.getItem(DRAFT_KEY));
              if (local) {
                initial = local;
                setMessage(
                  "Your browser draft is ready. Save it to your account before publishing.",
                );
              }
            } catch {}
          }
        }
        if (live) {
          setProfile(initial);
          baseline.current = !demo && !savedAccountPage ? "" : JSON.stringify(initial);
          setReady(true);
        }
      } catch (e) {
        if (live) {
          setLoadError((e as Error).message || "Your space could not be loaded. Please try again.");
        }
      }
    })();
    return () => {
      live = false;
    };
  }, [demo, loadAttempt]);
  useEffect(() => {
    if (!ready) return;
    if (demo) {
      const timer = setTimeout(() => {
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(profile));
        } catch {
          setError("This browser couldn't save the draft. Export it to keep a copy.");
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [profile, ready, demo, record?.version]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (ready && dirty && !demo) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty, demo, ready]);
  useEffect(() => {
    if (preview) dialog.current?.showModal();
    else dialog.current?.close();
  }, [preview]);
  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
    setMessage("");
    setError("");
  }
  async function request(url: string, method = "POST", body?: unknown) {
    const r = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await r.json();
    if (!r.ok) throw Error(result.error || "Please try again.");
    return result;
  }
  async function save() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const submitted = profile;
      const submittedEntitlementRevision = entitlementRevision.current;
      const parsed = profileSchema.safeParse(submitted);
      if (!parsed.success) throw Error(parsed.error.issues[0].message);
      if (demo) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(parsed.data));
        baseline.current = JSON.stringify(parsed.data);
        setProfile(parsed.data);
        setMessage("Draft saved in this browser. Sign in when you're ready to publish.");
        return null;
      }
      const data = await request("/api/profile", "PUT", {
        profile: parsed.data,
        version: record?.version || 0,
      });
      setRecord(data.profile);
      observeEntitlement(data.profile.entitlement, submittedEntitlementRevision);
      baseline.current = JSON.stringify(data.profile.draft);
      setProfile((current) => reconcileSavedDraft(submitted, current, data.profile.draft));
      setMessage("Your submitted draft is saved.");
      return data.profile as ProfileRecord;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    if (demo) {
      setError("Sign in to publish your space. Your draft stays in this browser.");
      return;
    }
    const saved = await save();
    if (!saved) return;
    setBusy(true);
    const publishedEntitlementRevision = entitlementRevision.current;
    try {
      const data = await request("/api/publish", "POST", { publish: true, version: saved.version });
      setRecord(data.profile);
      observeEntitlement(data.profile.entitlement, publishedEntitlementRevision);
      setMessage("Your space is live. Share /" + data.profile.handle + " with the world.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function paymentMessage(status: string) {
    if (status === "paid") {
      setPaymentPending(false);
      setMessage("Premium is confirmed. Your extra customization tools are ready.");
      return true;
    }
    if (["refunded", "disputed", "dispute_lost"].includes(status)) {
      setPaymentPending(false);
      setMessage(
        status === "disputed"
          ? "This purchase is suspended while its payment dispute is open."
          : "This upgrade is not active. Contact support if you need help with the payment.",
      );
      return true;
    }
    return false;
  }
  async function checkPayment() {
    setPaymentChecking(true);
    setError("");
    const expectedEntitlementRevision = entitlementRevision.current;
    try {
      const data = await request("/api/account", "GET");
      const status = observeEntitlement(data.entitlement || "free", expectedEntitlementRevision);
      if (!paymentMessage(status))
        setMessage("Payment is still being confirmed. Your draft is safe; check again shortly.");
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setPaymentChecking(false);
    }
  }
  useEffect(() => {
    if (!ready || demo || new URLSearchParams(location.search).get("purchase") !== "complete")
      return;
    let active = true,
      timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const check = async (attempt: number) => {
      if (!active) return;
      setPaymentChecking(true);
      const expectedEntitlementRevision = entitlementRevision.current;
      try {
        const r = await fetch("/api/account", { cache: "no-store", signal: controller.signal });
        const data = await r.json();
        if (!r.ok) throw Error(data.error || "Payment status could not be checked.");
        if (!active) return;
        const status = observeEntitlement(data.entitlement || "free", expectedEntitlementRevision);
        if (paymentMessage(status)) {
          setPaymentChecking(false);
          return;
        }
        if (attempt < siteConfig.paymentPollAttempts) {
          timer = setTimeout(() => void check(attempt + 1), siteConfig.paymentPollDelayMs);
          return;
        }
        setMessage(
          "Payment is still being confirmed. Your draft is safe; you can check again later.",
        );
      } catch (error) {
        if (!active) return;
        setError((error as Error).message);
      }
      if (active) setPaymentChecking(false);
    };
    void check(1);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      controller.abort();
    };
  }, [ready, demo]);
  async function image(file: File | undefined, key: "avatar" | "background", cardId?: string) {
    if (!file) return;
    setError("");
    try {
      const value = await optimizeImage(file, key === "avatar" && !cardId);
      if (cardId)
        setProfile((p) => ({
          ...p,
          cards: p.cards.map((c) => (c.id === cardId ? { ...c, image: value } : c)),
        }));
      else update(key, value);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function removeBrowserDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
      return true;
    } catch {
      return false;
    }
  }
  function exportData() {
    const data = JSON.stringify({ profile, exportedAt: new Date().toISOString() }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "ownspace-draft.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  async function loadGithub() {
    setBusy(true);
    setError("");
    try {
      setGithub(await request("/api/github", "GET"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function move(id: string, direction: number) {
    setProfile((p) => {
      const links = [...p.links];
      const index = links.findIndex((l) => l.id === id),
        next = index + direction;
      if (next < 0 || next >= links.length) return p;
      [links[index], links[next]] = [links[next], links[index]];
      return { ...p, links };
    });
  }
  const field = (label: string, children: React.ReactNode, help?: string) => (
    <label className="field-group">
      <span className="field-label">{label}</span>
      {isValidElement(children)
        ? cloneElement(children as ReactElement<{ "aria-label"?: string }>, { "aria-label": label })
        : children}
      {help && <span className="field-help">{help}</span>}
    </label>
  );
  if (loadError)
    return (
      <div className="studio">
        <header className="studio-top">
          <Logo />
          {!demo && <UserButton />}
        </header>
        <main id="main" className="auth-page">
          <div className="setting-box">
            <h1>Your space could not be opened.</h1>
            <p role="alert">{loadError}</p>
            <p>Your saved page stays as it is. Retry when your connection is ready.</p>
            <button
              className="button"
              onClick={() => {
                setLoadError("");
                setLoadAttempt((attempt) => attempt + 1);
              }}
            >
              Retry opening your space
            </button>
          </div>
        </main>
      </div>
    );
  if (!ready)
    return (
      <div className="studio">
        <div className="loading-line" />
        <div className="auth-page">Opening your space…</div>
      </div>
    );
  return (
    <div className="studio">
      <header className="studio-top">
        <Logo />
        <div className="studio-top-actions">
          <span className="save-indicator">
            {dirty
              ? "Unsaved changes"
              : demo
                ? "Browser draft"
                : record
                  ? "Draft saved"
                  : "Not saved to account"}
          </span>
          <button className="button secondary small" onClick={() => setPreview(true)}>
            <EyeIcon />
            Preview
          </button>
          <button className="button secondary small" onClick={save} disabled={busy}>
            Save
          </button>
          <button className="button small" onClick={publish} disabled={busy}>
            {busy ? "Working…" : record?.published ? "Publish changes" : "Publish"}
            <ArrowUpRightIcon />
          </button>
          {!demo && <UserButton />}
        </div>
      </header>
      <main id="main" className="studio-content">
        <aside className="studio-sidebar">
          <p>YOUR SPACE</p>
          {panels.map(({ id, name, icon: Icon }) => (
            <button
              className={"sidebar-item" + (panel === id ? " active" : "")}
              key={id}
              onClick={() => {
                setPanel(id);
                setError("");
                setMessage("");
                if (id === "connections" && !demo) void loadGithub();
              }}
              aria-current={panel === id ? "page" : undefined}
            >
              <Icon />
              {name}
            </button>
          ))}
          <div className="sidebar-bottom">
            <small>{premium ? "Premium account" : "Free account"}</small>
            <small>
              {premium ? "40 blocks and the full library" : "1 website with 6 basic blocks"}
            </small>
            <Link className="sidebar-item" href="/pricing">
              <ArrowUpRightIcon />
              Compare plans
            </Link>
            <Link className="sidebar-item" href="/">
              Back to Ownspace
            </Link>
          </div>
        </aside>
        <section className="studio-form">
          {demo && (
            <div className="notice-bar">
              Try it out. Your draft stays in this browser.{" "}
              <Link href="/sign-up">Sign in to publish.</Link>
            </div>
          )}
          {error && (
            <div className="studio-alert" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="studio-message" role="status">
              {message}
              {record?.published && (
                <div className="studio-share">
                  <a href={"/" + record.published.handle} target="_blank" rel="noopener noreferrer">
                    Open live page ↗
                  </a>
                  <button
                    onClick={() =>
                      void navigator.clipboard
                        .writeText(new URL("/" + record.published!.handle, location.origin).href)
                        .then(
                          () => setMessage("Link copied."),
                          () => setError("Could not copy. Open your page to copy its address."),
                        )
                    }
                  >
                    Copy link
                  </button>
                </div>
              )}
            </div>
          )}
          {paymentPending && !premium && (
            <button
              className="button secondary small"
              disabled={paymentChecking}
              onClick={() => void checkPayment()}
            >
              {paymentChecking ? "Checking payment…" : "Check payment status"}
            </button>
          )}
          <div className="studio-heading">
            <span className="eyebrow">
              {record?.published ? "YOUR PAGE IS LIVE" : "MAKE YOURSELF AT HOME"}
            </span>
            <h1>{panels.find((p) => p.id === panel)?.name}</h1>
            <p>
              {
                {
                  about: "A name, a face, a few words. Start with you.",
                  links: "Give the things you love somewhere to live.",
                  appearance: "Same you. Your own way of showing it.",
                  images: "A little more than links. Show what you're into.",
                  connections: "Bring your public projects into your space.",
                  settings: "Your page, your data, your choices.",
                }[panel]
              }
            </p>
          </div>
          {panel === "about" && (
            <div className="form-stack">
              <div className="avatar-field">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Your avatar" />
                ) : (
                  <div className="avatar-empty">
                    <UserIcon size={27} />
                  </div>
                )}
                {field(
                  "Profile photo",
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    aria-label="Upload profile photo"
                    onChange={(e) => void image(e.target.files?.[0], "avatar")}
                  />,
                )}
                {profile.avatar && (
                  <button
                    className="icon-button"
                    aria-label="Remove profile photo"
                    onClick={() => update("avatar", "")}
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
              {field(
                "Display name",
                <Input
                  value={profile.displayName}
                  maxLength={60}
                  onChange={(e) => update("displayName", e.target.value)}
                />,
              )}
              {field(
                "Page address",
                <Input
                  value={profile.handle}
                  maxLength={30}
                  onChange={(e) => update("handle", normalizeHandle(e.target.value))}
                />,
                "3–30 letters, numbers or hyphens. Changing this changes your public link.",
              )}
              {field(
                "A little about you",
                <Textarea
                  value={profile.bio}
                  maxLength={280}
                  onChange={(e) => update("bio", e.target.value)}
                />,
                profile.bio.length + "/280 characters",
              )}
              {field(
                "Cover image",
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={!premium}
                  onChange={(e) => void image(e.target.files?.[0], "background")}
                />,
                premium
                  ? "Images are resized and metadata is removed before upload."
                  : "Custom cover images are available with Premium.",
              )}
              {profile.background && (
                <button className="button secondary small" onClick={() => update("background", "")}>
                  Remove cover
                </button>
              )}
            </div>
          )}
          {panel === "links" && (
            <div className="form-stack">
              {profile.links.length === 0 && (
                <div className="empty-state">
                  Your next project, your favorite playlist, your socials. Add your first link
                  below.
                </div>
              )}
              {profile.links.map((link, i) => (
                <div className="link-edit-card" key={link.id}>
                  <div className="link-card-top">
                    <strong>Link {i + 1}</strong>
                    <div className="link-card-actions">
                      <button
                        className="icon-button"
                        aria-label={"Move link " + (i + 1) + " up"}
                        disabled={i === 0}
                        onClick={() => move(link.id, -1)}
                      >
                        <ArrowUpIcon />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={"Move link " + (i + 1) + " down"}
                        disabled={i === profile.links.length - 1}
                        onClick={() => move(link.id, 1)}
                      >
                        <ArrowDownIcon />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={"Delete link " + (i + 1)}
                        onClick={() =>
                          update(
                            "links",
                            profile.links.filter((l) => l.id !== link.id),
                          )
                        }
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                  {field(
                    "Label",
                    <Input
                      value={link.title}
                      maxLength={80}
                      onChange={(e) =>
                        update(
                          "links",
                          profile.links.map((l) =>
                            l.id === link.id ? { ...l, title: e.target.value } : l,
                          ),
                        )
                      }
                    />,
                  )}
                  {field(
                    "URL",
                    <Input
                      type="url"
                      value={link.url}
                      maxLength={2048}
                      placeholder="https://"
                      onChange={(e) =>
                        update(
                          "links",
                          profile.links.map((l) =>
                            l.id === link.id ? { ...l, url: e.target.value } : l,
                          ),
                        )
                      }
                    />,
                  )}
                  <div className="inline-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={link.enabled}
                        onChange={(e) =>
                          update(
                            "links",
                            profile.links.map((l) =>
                              l.id === link.id ? { ...l, enabled: e.target.checked } : l,
                            ),
                          )
                        }
                      />
                      Visible on your page
                    </label>
                  </div>
                </div>
              ))}
              <button
                className="add-button"
                disabled={profile.links.length >= linkLimit}
                onClick={() =>
                  update("links", [
                    ...profile.links,
                    { id: crypto.randomUUID(), title: "", url: "", enabled: true },
                  ])
                }
              >
                <PlusIcon /> Add a link
              </button>
              <span className="field-help">
                {profile.links.length} / {linkLimit} links
              </span>
            </div>
          )}
          {panel === "appearance" && (
            <div className="form-stack">
              <div className="template-grid">
                {themes.map((t) => (
                  <button
                    className={"template-option" + (profile.theme === t.id ? " selected" : "")}
                    key={t.id}
                    onClick={() => update("theme", t.id)}
                    disabled={!premium && t.id !== "night"}
                    aria-pressed={profile.theme === t.id}
                  >
                    <span className={"style-swatch swatch-" + t.id} />
                    <strong>{t.name}</strong>
                    <small>{t.description}</small>
                  </button>
                ))}
              </div>
              <div className="form-divider" />
              <p className="field-help">
                Free uses a fixed neutral style with Ownspace branding. Premium unlocks styles,
                backgrounds and the component library in the visual editor.
              </p>
              {field(
                "Accent color",
                <input
                  type="color"
                  disabled={!premium}
                  value={profile.accent}
                  onChange={(e) => update("accent", e.target.value)}
                />,
              )}
              {field(
                "Typography",
                <select
                  disabled={!premium}
                  value={profile.font}
                  onChange={(e) => update("font", e.target.value as Profile["font"])}
                >
                  <option value="manrope">Manrope</option>
                  <option value="mono">Monospace · Premium</option>
                </select>,
              )}
              {field(
                "Link layout",
                <select
                  disabled={!premium}
                  value={profile.layout}
                  onChange={(e) => update("layout", e.target.value as Profile["layout"])}
                >
                  <option value="stack">Stack</option>
                  <option value="grid">Grid · Premium</option>
                </select>,
              )}
              <div className="inline-row">
                <label>
                  <input
                    type="checkbox"
                    disabled={!premium}
                    checked={profile.showBrand}
                    onChange={(e) => update("showBrand", e.target.checked)}
                  />
                  Show Ownspace branding{" "}
                  {!premium && <span className="feature-lock">Premium to remove</span>}
                </label>
              </div>
            </div>
          )}
          {panel === "images" && (
            <div className="form-stack">
              {profile.cards.length === 0 && (
                <div className="empty-state">
                  Add photos, artwork or projects. Image cards sit below your links.
                </div>
              )}
              {profile.cards.map((card, i) => (
                <div className="link-edit-card" key={card.id}>
                  <div className="link-card-top">
                    <strong>Image card {i + 1}</strong>
                    <button
                      className="icon-button"
                      aria-label={"Delete image card " + (i + 1)}
                      onClick={() =>
                        update(
                          "cards",
                          profile.cards.filter((c) => c.id !== card.id),
                        )
                      }
                    >
                      <TrashIcon />
                    </button>
                  </div>
                  {field(
                    "Image",
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => void image(e.target.files?.[0], "background", card.id)}
                    />,
                  )}
                  {field(
                    "Title",
                    <Input
                      value={card.title}
                      maxLength={80}
                      onChange={(e) =>
                        update(
                          "cards",
                          profile.cards.map((c) =>
                            c.id === card.id ? { ...c, title: e.target.value } : c,
                          ),
                        )
                      }
                    />,
                  )}
                  {field(
                    "Caption",
                    <Input
                      value={card.caption}
                      maxLength={160}
                      onChange={(e) =>
                        update(
                          "cards",
                          profile.cards.map((c) =>
                            c.id === card.id ? { ...c, caption: e.target.value } : c,
                          ),
                        )
                      }
                    />,
                  )}
                </div>
              ))}
              <button
                className="add-button"
                disabled={profile.cards.length >= imageLimit}
                onClick={() =>
                  update("cards", [
                    ...profile.cards,
                    { id: crypto.randomUUID(), image: "", title: "", caption: "" },
                  ])
                }
              >
                <PlusIcon />
                Add an image card
              </button>
              <span className="field-help">
                {profile.cards.length} / {imageLimit} content images
              </span>
            </div>
          )}
          {panel === "connections" && (
            <div className="form-stack">
              <div className="setting-box">
                <GithubLogoIcon size={29} />
                <h2>Your projects, in one place.</h2>
                <p>
                  Connect GitHub to choose public repositories for your page. Nothing is imported or
                  published until you choose it.
                </p>
                {demo ? (
                  <p>Sign in to connect your account.</p>
                ) : (
                  <>
                    <button
                      className="button secondary small"
                      disabled={busy || github?.configured === false}
                      onClick={() =>
                        void action(async () => {
                          const data = await request("/api/github");
                          location.assign(data.url);
                        })
                      }
                    >
                      {github?.connected ? "Reconnect GitHub" : "Connect GitHub"}
                      <ArrowUpRightIcon />
                    </button>
                    {github?.configured === false && (
                      <p>
                        GitHub importing is currently unavailable. You can still add a GitHub URL in
                        Links.
                      </p>
                    )}
                    {github?.connected && (
                      <button
                        className="text-link"
                        onClick={() =>
                          void action(async () => {
                            await request("/api/github", "DELETE");
                            setGithub({ configured: true, connected: false, repos: [] });
                            setMessage("GitHub disconnected.");
                          })
                        }
                      >
                        Disconnect GitHub
                      </button>
                    )}
                  </>
                )}
              </div>
              {github?.connected && (
                <div className="repository-list">
                  {github.repos.length === 0 ? (
                    <div className="empty-state">No public repositories found.</div>
                  ) : (
                    github.repos.map((r) => (
                      <div className="repository-row" key={r.id}>
                        <div>
                          <b>{r.title}</b>
                          <p>{r.description.slice(0, 85)}</p>
                        </div>
                        <button
                          className="button secondary"
                          disabled={
                            profile.links.length >= linkLimit ||
                            profile.links.some((l) => l.url === r.url)
                          }
                          onClick={() => {
                            update("links", [
                              ...profile.links,
                              {
                                id: crypto.randomUUID(),
                                title: r.title,
                                url: r.url,
                                enabled: true,
                              },
                            ]);
                            setMessage("Added to your draft. Publish when you're ready.");
                          }}
                        >
                          {profile.links.some((l) => l.url === r.url) ? "Added" : "Add"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          {panel === "settings" && (
            <div className="form-stack">
              <div className="setting-box">
                <h2>{premium ? "Premium is active." : "Build more with Premium."}</h2>
                <p>
                  {premium
                    ? "Your account includes the component library, 40 website blocks, custom styles and React source export. No subscription."
                    : "30+ components, 40 website blocks, custom backgrounds and styles, branding removal and React source export. " +
                      siteConfig.priceLabel +
                      " once."}
                </p>
                {!premium && (
                  <button
                    className="button small"
                    disabled={busy || demo || paymentPending}
                    onClick={() =>
                      void action(async () => {
                        if (dirty) throw Error("Save your page before leaving for billing.");
                        location.assign("/dashboard/billing");
                      })
                    }
                  >
                    Unlock Premium <ArrowUpRightIcon />
                  </button>
                )}
                <p>
                  <Link href="/dashboard/billing">Billing & purchase status</Link>
                </p>
                {demo && <p>Sign in to save online and purchase Premium.</p>}
              </div>
              <div className="setting-box">
                <h2>Publication</h2>
                <p>
                  {record?.published
                    ? "Your published page is available at /" +
                      record.published.handle +
                      ". Changes stay in your draft until you publish again."
                    : "Your page is private until you publish."}
                </p>
                {record?.published && (
                  <>
                    <a
                      className="text-link"
                      href={"/" + record.published.handle}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open your page <ArrowUpRightIcon />
                    </a>
                    <button
                      className="button secondary small"
                      disabled={busy}
                      onClick={() =>
                        void action(async () => {
                          const data = await request("/api/publish", "POST", {
                            publish: false,
                            version: record.version,
                          });
                          setRecord(data.profile);
                          setMessage("Your page is offline. Your draft is still saved.");
                        })
                      }
                    >
                      Take page offline
                    </button>
                  </>
                )}
                <p>
                  {record?.views || 0} consented page views. Visitors who reject analytics aren’t
                  counted.
                </p>
              </div>
              <div className="setting-box">
                <h2>Keep a copy.</h2>
                <p>Download your current draft as JSON. Your content belongs to you.</p>
                <button className="button secondary small" onClick={exportData}>
                  <DownloadSimpleIcon />
                  Export draft
                </button>
                {!demo && (
                  <a className="text-link" href="/api/export">
                    Export saved account data
                  </a>
                )}
              </div>
              <div className="setting-box">
                <h2>Privacy choices</h2>
                <p>Change optional tracking preferences whenever you like.</p>
                <button
                  className="button secondary small"
                  onClick={() => window.dispatchEvent(new Event("ownspace-cookie-settings"))}
                >
                  Cookie settings
                </button>
                <Link className="text-link" href="/privacy">
                  Read the privacy policy
                </Link>
              </div>
              <div className="setting-box">
                <h2>Delete your space</h2>
                <p>
                  This removes the profile, published page and GitHub connection. Type DELETE to
                  confirm. Deleting an account also removes your Clerk sign-in. Payment records may
                  be retained for required accounting.
                </p>
                {field(
                  "Confirmation",
                  <Input
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                    placeholder="DELETE"
                  />,
                )}
                <button
                  className="button secondary small danger-button"
                  disabled={deleteText !== "DELETE" || busy}
                  onClick={() =>
                    void action(async () => {
                      if (demo) {
                        localStorage.removeItem(DRAFT_KEY);
                        baseline.current = JSON.stringify(emptyProfile);
                        setProfile({ ...emptyProfile });
                        setDeleteText("");
                        setMessage("Browser draft deleted.");
                        return;
                      }
                      await request("/api/profile", "DELETE");
                      const browserCleared = removeBrowserDraft();
                      setRecord(null);
                      baseline.current = JSON.stringify(emptyProfile);
                      setProfile({ ...emptyProfile });
                      setMessage(
                        browserCleared
                          ? "Your space has been deleted."
                          : "Your space has been deleted online. This browser could not remove its draft copy; clear this site’s browser data to remove it.",
                      );
                      setDeleteText("");
                    })
                  }
                >
                  Delete page
                </button>
                {!demo && (
                  <button
                    className="button secondary small danger-button"
                    disabled={deleteText !== "DELETE" || busy}
                    onClick={() =>
                      void action(async () => {
                        await request("/api/account", "DELETE");
                        setRecord(null);
                        baseline.current = JSON.stringify(emptyProfile);
                        setProfile({ ...emptyProfile });
                        setDeleteText("");
                        if (!removeBrowserDraft()) {
                          setMessage(
                            "Your account has been deleted. This browser could not remove its draft copy; clear this site’s browser data to remove it.",
                          );
                          return;
                        }
                        location.assign("/");
                      })
                    }
                  >
                    Delete account and page
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
        <aside className="studio-preview" aria-label="Live page preview">
          <div className="preview-toolbar">
            <span>YOUR PAGE, AS YOU MAKE IT</span>
            <div>
              <button
                className="icon-button"
                aria-label="Mobile preview"
                aria-pressed={!wide}
                onClick={() => setWide(false)}
              >
                <DeviceMobileIcon />
              </button>
              <button
                className="icon-button"
                aria-label="Wide preview"
                aria-pressed={wide}
                onClick={() => setWide(true)}
              >
                <DesktopIcon />
              </button>
            </div>
          </div>
          <div
            tabIndex={0}
            role="region"
            aria-label="Scroll your page preview"
            className={"editor-preview-frame" + (wide ? " desktop-preview" : "")}
          >
            <ProfileView profile={profile} compact={!wide} interactive={false} />
          </div>
          <p className="preview-caption">
            Live preview · {profile.handle}
            <br />
            Your changes stay private until you publish.
          </p>
        </aside>
      </main>
      <dialog ref={dialog} className="full-preview-overlay" onCancel={() => setPreview(false)}>
        <div className="full-preview-controls">
          <button className="button secondary small" onClick={() => setPreview(false)}>
            Back to editing
          </button>
        </div>
        <ProfileView profile={profile} interactive={false} />
      </dialog>
    </div>
  );
}
