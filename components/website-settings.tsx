"use client";
import { useState, useRef } from "react";
import type { Profile } from "@/lib/profile";
import { defaultSiteSettings, type SiteSettings } from "@/lib/site-settings";
import { optimizeImage } from "@/lib/image-upload";
import { FREE_SITE_STYLE } from "@/lib/plans";
export function WebsiteSettings({
  profile,
  premium,
  onChange,
}: {
  profile: Profile;
  premium: boolean;
  onChange: <K extends keyof Profile>(key: K, value: Profile[K]) => void;
}) {
  const site = profile.site || { ...defaultSiteSettings, mode: "profile" as const };
  const siteRef = useRef(site);
  siteRef.current = site;
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  function setting<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    const next = { ...siteRef.current, [key]: value };
    siteRef.current = next;
    onChange("site", next);
  }
  return (
    <details className="website-editor-profile">
      <summary>Canvas and background{!premium && " · Premium styles"}</summary>
      <div>
        {!premium && (
          <button
            type="button"
            onClick={() => {
              onChange("site", { ...FREE_SITE_STYLE, mode: site.mode });
              onChange("background", "");
            }}
          >
            Use Free appearance
          </button>
        )}
        <label>
          Page layout
          <select
            aria-label="Page layout"
            value={site.mode}
            onChange={(e) => setting("mode", e.currentTarget.value as SiteSettings["mode"])}
          >
            <option value="website">Full website</option>
            <option value="profile">Legacy profile</option>
          </select>
        </label>
        <label>
          Content width
          <select
            aria-label="Content width"
            value={site.width}
            disabled={!premium}
            onChange={(e) => setting("width", e.currentTarget.value as SiteSettings["width"])}
          >
            <option value="narrow">Narrow</option>
            <option value="standard">Standard</option>
            <option value="wide">Wide</option>
          </select>
        </label>
        <label>
          Background pattern
          <select
            aria-label="Background pattern"
            value={site.pattern}
            disabled={!premium}
            onChange={(e) => setting("pattern", e.currentTarget.value as SiteSettings["pattern"])}
          >
            {["none", "grid", "dots", "lines"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Background color
          <input
            type="color"
            disabled={!premium}
            value={site.backgroundColor}
            onChange={(e) => setting("backgroundColor", e.currentTarget.value)}
          />
        </label>
        <label>
          Text color
          <input
            type="color"
            disabled={!premium}
            value={site.foreground}
            onChange={(e) => setting("foreground", e.currentTarget.value)}
          />
        </label>
        <label>
          Accent color
          <input
            type="color"
            disabled={!premium}
            value={profile.accent}
            onChange={(e) => onChange("accent", e.currentTarget.value)}
          />
        </label>
        <label>
          Font
          <select
            aria-label="Font"
            disabled={!premium}
            value={profile.font}
            onChange={(e) => onChange("font", e.currentTarget.value as Profile["font"])}
          >
            <option value="manrope">Manrope</option>
            <option value="mono">Monospace</option>
          </select>
        </label>
        <label>
          Ownspace attribution
          <select
            aria-label="Ownspace attribution"
            disabled={!premium}
            value={String(profile.showBrand)}
            onChange={(e) => onChange("showBrand", e.currentTarget.value === "true")}
          >
            <option value="true">Visible</option>
            <option value="false">Hidden</option>
          </select>
        </label>
        <label>
          Background image
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={!premium || busy}
            onChange={async (e) => {
              const file = e.currentTarget.files?.[0];
              if (!file) return;
              setBusy(true);
              setError("");
              try {
                setting("backgroundImage", await optimizeImage(file));
              } catch (error) {
                setError(error instanceof Error ? error.message : "Unable to read this image.");
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
        {site.backgroundImage && (
          <button
            type="button"
            disabled={!premium || busy}
            onClick={() => setting("backgroundImage", "")}
          >
            Remove background image
          </button>
        )}
        {busy && <p role="status">Preparing background…</p>}
        {error && <p role="alert">{error}</p>}
        <p>
          {premium
            ? "Changes appear on your live site after saving and publishing."
            : "Free uses a fixed neutral canvas with Ownspace attribution. Custom backgrounds, colors and library elements require Premium."}{" "}
          The full website layout hides the legacy avatar, bio and link list; their data stays in{" "}
          <a href="/studio">profile tools</a>.
        </p>
      </div>
    </details>
  );
}
