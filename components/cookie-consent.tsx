"use client";
import { createPixelDispatcher } from "@/lib/pixel";
import { useState, useEffect, useRef } from "react";
import { getStoredConsent, persistConsent } from "@/lib/browser-consent";
import Link from "next/link";
import { XIcon } from "@phosphor-icons/react";
import { CONSENT_KEY, readConsent, makeConsent, allowsTracking, type Consent } from "@/lib/consent";
import { siteConfig } from "@/lib/config";
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    "ga-disable": boolean;
  }
  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}
export function CookieConsent({ gpcHeader = false }: { gpcHeader?: boolean }) {
  const [open, setOpen] = useState(false),
    [details, setDetails] = useState(false),
    [analytics, setAnalytics] = useState(false),
    [marketing, setMarketing] = useState(false),
    [gpc, setGpc] = useState(false);
  const channel = useRef<BroadcastChannel | null>(null);
  const preferencesOpen = useRef(false);
  const lastApplied = useRef<string | undefined>(undefined);
  useEffect(() => {
    const g = gpcHeader || Boolean(navigator.globalPrivacyControl);
    setGpc(g);
    const applyChoice = (input: Consent | null) => {
      let consent = input;
      if (g && consent && (consent.analytics || consent.marketing)) {
        consent = makeConsent(false, false);
        persistConsent(consent);
      }
      const serialized = JSON.stringify(consent);
      if (serialized === lastApplied.current) return;
      lastApplied.current = serialized;
      setAnalytics(Boolean(consent?.analytics && !g));
      setMarketing(Boolean(consent?.marketing && !g));
      if (!consent) setOpen(true);
      else if (!preferencesOpen.current) setOpen(false);
      applyTracking(consent, g);
      window.dispatchEvent(new CustomEvent("ownspace-consent-changed", { detail: consent }));
    };
    const sync = () => applyChoice(getStoredConsent());
    sync();
    const storage = (event: StorageEvent) => {
      if (event.key === CONSENT_KEY || event.key === null) sync();
    };
    const visible = () => {
      if (document.visibilityState === "visible") sync();
    };
    const reopen = () => {
      preferencesOpen.current = true;
      setDetails(true);
      setOpen(true);
    };
    try {
      channel.current = new BroadcastChannel(CONSENT_KEY + "-updates");
      channel.current.onmessage = (event) => {
        const consent = readConsent(JSON.stringify(event.data));
        if (consent) {
          const saved = getStoredConsent();
          applyChoice(saved && saved.updatedAt >= consent.updatedAt ? saved : consent);
        }
      };
    } catch {}
    window.addEventListener("storage", storage);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("ownspace-cookie-settings", reopen);
    return () => {
      channel.current?.close();
      channel.current = null;
      window.removeEventListener("storage", storage);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("ownspace-cookie-settings", reopen);
    };
  }, [gpcHeader]);
  function choose(a: boolean, m: boolean) {
    const consent = makeConsent(a && !gpc, m && !gpc);
    persistConsent(consent);
    lastApplied.current = JSON.stringify(consent);
    setAnalytics(consent.analytics);
    setMarketing(consent.marketing);
    applyTracking(consent, gpc);
    window.dispatchEvent(new CustomEvent("ownspace-consent-changed", { detail: consent }));
    preferencesOpen.current = false;
    try {
      channel.current?.postMessage(consent);
    } catch {}
    setOpen(false);
    setDetails(false);
  }
  if (!open) return null;
  return (
    <aside className="cookie-banner" aria-label="Cookie choices">
      <div className="cookie-copy">
        <strong>Your space. Your choices.</strong>
        <p>
          We use essential storage to keep the site working. Analytics and marketing are optional.{" "}
          <Link href="/cookies">Cookie details</Link>
        </p>
      </div>
      {details && (
        <div className="cookie-options">
          <label>
            <span>
              Essential <small>Sign-in, security and your choices</small>
            </span>
            <input type="checkbox" checked disabled aria-label="Essential cookies always on" />
          </label>
          <label>
            <span>
              Analytics <small>Help us understand how pages are used</small>
            </span>
            <input
              type="checkbox"
              checked={analytics}
              disabled={gpc}
              onChange={(e) => setAnalytics(e.target.checked)}
            />
          </label>
          <label>
            <span>
              Marketing <small>Measure advertising, if configured</small>
            </span>
            <input
              type="checkbox"
              checked={marketing}
              disabled={gpc}
              onChange={(e) => setMarketing(e.target.checked)}
            />
          </label>
          {gpc && <p>Global Privacy Control is on. Optional tracking stays off.</p>}
        </div>
      )}
      <div className="cookie-actions">
        <button className="button secondary small" onClick={() => choose(false, false)}>
          Reject optional
        </button>
        {details ? (
          <button className="button secondary small" onClick={() => choose(analytics, marketing)}>
            Save choices
          </button>
        ) : (
          <button
            className="button secondary small"
            onClick={() => {
              preferencesOpen.current = true;
              setDetails(true);
            }}
          >
            Customize
          </button>
        )}
        <button className="button secondary small" onClick={() => choose(true, true)}>
          Accept optional
        </button>
        {details && (
          <button
            className="icon-button"
            aria-label="Close cookie settings"
            onClick={() => {
              preferencesOpen.current = false;
              setDetails(false);
            }}
          >
            <XIcon />
          </button>
        )}
      </div>
    </aside>
  );
}
function removeCookies(prefixes: string[]) {
  const host = location.hostname.split(".");
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.trim().split("=")[0];
    if (prefixes.some((p) => name.startsWith(p))) {
      document.cookie = name + "=; Max-Age=0; Path=/";
      for (let i = 0; i < host.length - 1; i++)
        document.cookie = name + "=; Max-Age=0; Path=/; Domain=." + host.slice(i).join(".");
    }
  }
}
function script(id: string, src: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.src = src;
  s.async = true;
  document.head.appendChild(s);
}
let previousTrackingChoice: string | undefined;
function applyTracking(c: Consent | null, gpc: boolean) {
  const a = allowsTracking(c, "analytics", gpc),
    m = allowsTracking(c, "marketing", gpc);
  const choice = JSON.stringify([siteConfig.gaId, siteConfig.metaPixel, a, m]);
  if (previousTrackingChoice === choice) return;
  previousTrackingChoice = choice;
  if (siteConfig.gaId && /^G-[A-Z0-9]+$/.test(siteConfig.gaId)) {
    (window as unknown as Record<string, unknown>)["ga-disable-" + siteConfig.gaId] = !a;
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function () {
        window.dataLayer!.push(arguments);
      };
    window.gtag("consent", "update", {
      analytics_storage: a ? "granted" : "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    if (a) {
      script("ownspace-ga", "https://www.googletagmanager.com/gtag/js?id=" + siteConfig.gaId);
      window.gtag("js", new Date());
      window.gtag("config", siteConfig.gaId);
    } else {
      document.getElementById("ownspace-ga")?.remove();
      removeCookies(["_ga", "_gid", "_gat"]);
    }
  }
  if (siteConfig.metaPixel && /^\d+$/.test(siteConfig.metaPixel)) {
    if (m) {
      if (!window.fbq) {
        window.fbq = createPixelDispatcher();
      }
      script("ownspace-meta", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("consent", "grant");
      window.fbq("init", siteConfig.metaPixel);
      window.fbq("track", "PageView");
    } else {
      window.fbq?.("consent", "revoke");
      document.getElementById("ownspace-meta")?.remove();
      removeCookies(["_fbp", "_fbc"]);
    }
  }
}
