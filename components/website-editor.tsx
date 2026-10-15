"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Puck } from "@puckeditor/core";
import "@puckeditor/core/no-external.css";
import "./website-editor.css";
import { Logo } from "./logo";
import { WebsiteLibrary } from "./website-library";
import { WebsiteSettings } from "./website-settings";
import { defaultSiteSettings } from "@/lib/site-settings";
import { planIssue } from "@/lib/plans";
import { ProfileView } from "./profile-view";
import { createWebsiteConfig, type WebsiteData } from "./website-editor-config";
import {
  emptyProfile,
  profileSchema,
  sanitizeProfile,
  type Profile,
  type ProfileRecord,
} from "@/lib/profile";
import { readDraft } from "@/lib/draft";
import { emptyWebsite, websiteDraftFingerprint, reconcileWebsiteDraft } from "@/lib/website";
import {
  readWebsiteRecovery,
  rememberWebsiteRecovery,
  forgetWebsiteRecovery,
} from "@/lib/website-recovery";
import { installPuckAccessibility } from "@/lib/website-editor-accessibility";
const DRAFT_KEY = "ownspace-draft-v1";
function editorData(profile: Profile): WebsiteData {
  const document = profile.website || emptyWebsite;
  return { root: document.root, content: document.content } as WebsiteData;
}
async function request(url: string, method?: string, body?: unknown) {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Error("Couldn't connect. Your edits are still here; try again.");
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(result.error || "We couldn't finish that request. Try again.");
  return result;
}
export function WebsiteEditor({ demo }: { demo: boolean }) {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [data, setData] = useState<WebsiteData>(() => editorData(emptyProfile));
  const [record, setRecord] = useState<ProfileRecord | null>(null);
  const [entitlement, setEntitlement] = useState("free");
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [baseline, setBaseline] = useState("");
  const [preview, setPreview] = useState(false);
  const [editorRevision, setEditorRevision] = useState(0);
  const profileRef = useRef(profile),
    dataRef = useRef(data),
    recordRef = useRef(record),
    busyRef = useRef(false);
  const recoveryScope = useRef<string | null>(null),
    recoveryRevision = useRef<number | undefined>(undefined),
    saveVersion = useRef(0),
    baselineRef = useRef("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const current = {
    ...profile,
    website: { version: 1 as const, root: { props: {} }, content: data.content },
  };
  const dirty = websiteDraftFingerprint(current) !== baseline;
  const premium = entitlement === "paid";
  const config = useMemo(
    () => createWebsiteConfig(profile, entitlement === "paid"),
    [profile, entitlement],
  );
  const overrides = useMemo(
    () => ({
      header: ({ children }: { children: ReactNode }) => (
        <div className="website-puck-header">
          {children}
          <div className="website-library-toolbar">
            <WebsiteLibrary premium={premium} />
            <span>
              {premium
                ? "Add a section from the library, or drag a block from the sidebar."
                : "Free: 6 basic blocks · 3 links · 1 content image"}
            </span>
          </div>
        </div>
      ),
      headerActions: () => (
        <span className="website-editor-puck-hint">Private until published</span>
      ),
    }),
    [premium],
  );
  useEffect(() => {
    let live = true;
    setLoadError("");
    (async () => {
      try {
        let initial: Profile = {
          ...emptyProfile,
          site: { ...defaultSiteSettings },
          website: emptyWebsite,
        };
        let saved: ProfileRecord | null = null;
        let browserSaved = false;
        let scope: string | null = demo ? "demo" : null;
        let recovered = false;
        let deletedRecovery = false;
        if (demo) {
          try {
            const cached = readDraft(localStorage.getItem(DRAFT_KEY));
            if (cached) {
              initial = cached;
              browserSaved = true;
            }
          } catch {
            /* A fresh browser draft works even when storage is unavailable. */
          }
        } else {
          const result = await request("/api/profile");
          saved = result.profile;
          const owner = result.owner || saved?.owner;
          if (owner) scope = `account:${owner}`;
          if (saved) initial = saved.draft;
          else {
            try {
              const cached = readDraft(localStorage.getItem(DRAFT_KEY));
              if (cached) {
                initial = cached;
                if (live)
                  setMessage(
                    "Your browser draft is ready. Save it to your account before publishing.",
                  );
              }
            } catch {}
          }
          if (live) setEntitlement(result.entitlement || saved?.entitlement || "free");
        }
        if (!saved && !browserSaved) {
          const handle = new URLSearchParams(window.location.search).get("handle");
          if (handle && /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(handle))
            initial = { ...initial, handle };
        }
        if (!live) return;
        saveVersion.current = saved?.version || 0;
        recoveryScope.current = scope;
        recoveryRevision.current = undefined;
        const recovery = scope ? readWebsiteRecovery(scope) : undefined;
        if (recovery && !demo && !saved && recovery.version > 0) {
          forgetWebsiteRecovery(scope!, recovery.revision);
          initial = { ...emptyProfile, site: { ...defaultSiteSettings }, website: emptyWebsite };
          browserSaved = false;
          deletedRecovery = true;
          setMessage("Your previous page was deleted. Start a new draft when you are ready.");
        } else if (recovery) {
          initial = recovery.profile;
          saveVersion.current = recovery.version;
          recoveryRevision.current = recovery.revision;
          recovered = true;
          setMessage("Recovered your unsaved changes from this tab. Save your draft to keep them.");
        }
        const initialData = editorData(initial);
        profileRef.current = initial;
        dataRef.current = initialData;
        recordRef.current = saved;
        setProfile(initial);
        setData(initialData);
        setRecord(saved);
        const initialBaseline =
          !recovered && !deletedRecovery && (saved || browserSaved)
            ? websiteDraftFingerprint({
                ...initial,
                website: { version: 1, root: { props: {} }, content: initialData.content },
              })
            : "";
        baselineRef.current = initialBaseline;
        setBaseline(initialBaseline);
        setReady(true);
      } catch (error) {
        if (live)
          setLoadError(error instanceof Error ? error.message : "Unable to load your page.");
      }
    })();
    return () => {
      live = false;
    };
  }, [demo, attempt]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (ready && dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [ready, dirty]);
  useEffect(() => {
    if (preview) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [preview]);
  useEffect(() => {
    if (!ready || !canvasRef.current) return;
    return installPuckAccessibility(canvasRef.current);
  }, [ready]);
  function updateProfile<K extends keyof Profile>(key: K, value: Profile[K]) {
    const next = { ...profileRef.current, [key]: value };
    profileRef.current = next;
    setProfile(next);
    rememberCurrentChanges();
    setMessage("");
  }
  function changeData(next: WebsiteData) {
    const previous = websiteDraftFingerprint(getCurrentProfile());
    dataRef.current = next;
    setData(next);
    if (websiteDraftFingerprint(getCurrentProfile()) !== previous) {
      rememberCurrentChanges();
      setMessage("");
    }
  }
  function getCurrentProfile() {
    return {
      ...profileRef.current,
      website: { version: 1, root: { props: {} }, content: dataRef.current.content },
    };
  }
  function rememberCurrentChanges() {
    const scope = recoveryScope.current;
    if (!scope) return;
    const current = getCurrentProfile() as Profile;
    if (websiteDraftFingerprint(current) !== baselineRef.current) {
      recoveryRevision.current = rememberWebsiteRecovery(scope, current, saveVersion.current);
    } else if (recoveryRevision.current !== undefined) {
      forgetWebsiteRecovery(scope, recoveryRevision.current);
      recoveryRevision.current = undefined;
    }
  }
  async function save() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const submittedRaw = getCurrentProfile() as Profile;
      const parsed = profileSchema.safeParse(submittedRaw);
      if (!parsed.success)
        throw Error(parsed.error.issues[0]?.message || "Check your page details.");
      const submitted = parsed.data;
      const issue = planIssue(submitted, premium);
      if (issue) throw Error(issue);
      let saved = submitted;
      if (demo) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(submitted));
      } else {
        const result = await request("/api/profile", "PUT", {
          profile: submitted,
          version: saveVersion.current,
        });
        const nextRecord = result.profile as ProfileRecord;
        saved = nextRecord.draft;
        saveVersion.current = nextRecord.version;
        recordRef.current = nextRecord;
        setRecord(nextRecord);
        setEntitlement(nextRecord.entitlement);
      }
      // A response acknowledges only the submitted snapshot. Edits made during the request survive.
      const latest = getCurrentProfile() as Profile;
      const reconciled = reconcileWebsiteDraft(submittedRaw, latest, saved);
      if (
        websiteDraftFingerprint(latest.website) === websiteDraftFingerprint(submittedRaw.website) &&
        websiteDraftFingerprint(saved.website) !== websiteDraftFingerprint(submittedRaw.website)
      ) {
        const normalizedData = editorData(saved);
        dataRef.current = normalizedData;
        setData(normalizedData);
        setEditorRevision((value) => value + 1);
      }
      profileRef.current = reconciled;
      setProfile(reconciled);
      const acknowledged = websiteDraftFingerprint(saved);
      baselineRef.current = acknowledged;
      setBaseline(acknowledged);
      const scope = recoveryScope.current,
        revision = recoveryRevision.current;
      if (scope && revision !== undefined) {
        if (websiteDraftFingerprint(getCurrentProfile()) === acknowledged) {
          forgetWebsiteRecovery(scope, revision);
          recoveryRevision.current = undefined;
        } else {
          recoveryRevision.current = rememberWebsiteRecovery(
            scope,
            getCurrentProfile() as Profile,
            saveVersion.current,
            revision,
          );
        }
      }
      setMessage(
        demo
          ? "Draft saved in this browser. Sign in to save to your account."
          : "Draft saved. Publish when you're ready to update your live page.",
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save your draft.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function publish(publish: boolean) {
    if (demo || busyRef.current || !recordRef.current) return;
    if (publish && dirty) {
      setError("Save your changes before publishing.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await request("/api/publish", "POST", {
        publish,
        version: recordRef.current.version,
      });
      recordRef.current = result.profile;
      setRecord(result.profile);
      setEntitlement(result.profile.entitlement);
      setMessage(
        publish
          ? "Your saved page is published."
          : "Your page is unpublished. Your draft is still saved.",
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to update publication.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function exportSource() {
    if (!premium || busyRef.current) return;
    setError("");
    setBusy(true);
    busyRef.current = true;
    try {
      const response = await fetch("/api/site-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: getCurrentProfile() }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw Error(result.error || "Unable to export source.");
      }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = profileRef.current.handle + "-source.zip";
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage("React source downloaded. The ZIP includes setup instructions.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to export source.");
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }
  function exportDraft() {
    const blob = new Blob([JSON.stringify(getCurrentProfile(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ownspace-draft.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  const parsedPreview = profileSchema.safeParse(current);
  if (!ready)
    return (
      <main className="website-editor-loading" id="main">
        <Logo />
        <h1>{loadError ? "Your page couldn't be loaded" : "Opening your website…"}</h1>
        {loadError && (
          <>
            <p role="alert">{loadError}</p>
            <button type="button" onClick={() => setAttempt((value) => value + 1)}>
              Try again
            </button>
          </>
        )}
        <Link href="/dashboard">Back to dashboard</Link>
      </main>
    );
  return (
    <main
      id="main"
      className="website-editor-shell"
      onClickCapture={(event) => {
        const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
        if (
          !dirty ||
          !anchor ||
          anchor.getAttribute("target") === "_blank" ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey
        )
          return;
        if (
          !window.confirm(
            "Leave the editor with unsaved changes? Save or export your draft first to keep them.",
          )
        ) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <div className="website-editor-top">
        <Logo compact />
        <Link href="/dashboard">Dashboard</Link>
        <span className="website-editor-label">Website editor</span>
        <Link href="/dashboard/billing">{premium ? "Premium & billing" : "Unlock Premium"}</Link>
        <span className="website-editor-state">
          {demo ? "Private browser demo" : record?.published ? "Published" : "Private draft"} ·{" "}
          {dirty ? "Unsaved changes" : "Draft saved"}
        </span>
        <button type="button" onClick={exportDraft}>
          Export draft
        </button>
        <button
          type="button"
          disabled={!premium || busy || demo}
          onClick={exportSource}
          title={!premium ? "React source export requires Premium" : undefined}
        >
          Download React source
        </button>
        <button type="button" onClick={() => setPreview(true)}>
          Preview
        </button>
        <button type="button" className="website-editor-primary" disabled={busy} onClick={save}>
          {busy ? "Working…" : "Save draft"}
        </button>
        <button
          type="button"
          disabled={demo || busy || dirty || !record}
          onClick={() => publish(true)}
        >
          Publish saved page
        </button>
        {record?.published && (
          <button type="button" disabled={busy} onClick={() => publish(false)}>
            Unpublish
          </button>
        )}
      </div>
      <div className="website-editor-notices" aria-live="polite">
        {demo && (
          <p>
            This demo stays private. Save keeps your draft in this browser.{" "}
            <Link href="/sign-in">Sign in</Link> to save online and publish.
          </p>
        )}
        {error && (
          <p role="alert">
            {error} <Link href="/dashboard">Account and agreements</Link>
          </p>
        )}
        {message && <p role="status">{message}</p>}
      </div>
      <details className="website-editor-profile">
        <summary>Website details · {profile.displayName}</summary>
        <div>
          <label>
            Page address
            <input
              value={profile.handle}
              maxLength={30}
              onChange={(event) => updateProfile("handle", event.currentTarget.value)}
            />
          </label>
          <label>
            Display name
            <input
              value={profile.displayName}
              maxLength={60}
              onChange={(event) => updateProfile("displayName", event.currentTarget.value)}
            />
          </label>
          <label>
            Description
            <textarea
              value={profile.bio}
              maxLength={280}
              onChange={(event) => updateProfile("bio", event.currentTarget.value)}
            />
          </label>
          <p>
            Manage your existing links, images and page theme in{" "}
            <Link href="/studio">profile tools</Link>.{" "}
            {premium
              ? "Canvas appearance is available below."
              : "Free pages keep the Ownspace branding and standard accent."}
          </p>
        </div>
      </details>
      <WebsiteSettings profile={profile} premium={premium} onChange={updateProfile} />
      <p className="website-editor-hint">
        Drag a block onto your page. Select it to edit its properties. Use the layers panel to
        rearrange sections and the toolbar to undo, redo or switch screen sizes.{" "}
        <Link href="/legal">Publication terms</Link>
      </p>
      <div className="website-editor-canvas" ref={canvasRef}>
        <Puck
          key={editorRevision}
          config={config}
          data={data}
          onChange={changeData}
          headerTitle="Ownspace"
          headerPath={`/${profile.handle}`}
          height="calc(100dvh - 180px)"
          viewports={[
            { width: 390, height: "auto", label: "Mobile", icon: "Smartphone" },
            { width: 768, height: "auto", label: "Tablet", icon: "Tablet" },
            { width: 1200, height: "auto", label: "Desktop", icon: "Monitor" },
          ]}
          overrides={overrides}
        />
      </div>
      <dialog
        className="website-editor-preview"
        aria-labelledby="website-preview-title"
        ref={dialogRef}
        onClose={() => setPreview(false)}
      >
        <div className="website-editor-preview-bar">
          <strong id="website-preview-title">Page preview</strong>
          <button type="button" onClick={() => setPreview(false)}>
            Close preview
          </button>
        </div>
        {parsedPreview.success ? (
          <ProfileView profile={sanitizeProfile(parsedPreview.data, premium)} interactive />
        ) : (
          <p>
            Correct the page details before previewing: {parsedPreview.error.issues[0]?.message}
          </p>
        )}
      </dialog>
    </main>
  );
}
