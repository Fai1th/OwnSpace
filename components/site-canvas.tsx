import type { CSSProperties, ReactNode } from "react";
import type { Profile } from "@/lib/profile";
import { defaultSiteSettings } from "@/lib/site-settings";
import { websiteImage } from "@/lib/site-safety";
import "./site-canvas.css";
export function SiteCanvas({
  profile,
  children,
  compact = false,
  interactive = true,
}: {
  profile: Profile;
  children: ReactNode;
  compact?: boolean;
  interactive?: boolean;
}) {
  const site = profile.site || defaultSiteSettings;
  const image =
    site.backgroundImage && websiteImage(site.backgroundImage) ? site.backgroundImage : "";
  const style = {
    "--site-background": site.backgroundColor,
    "--site-foreground": site.foreground,
    "--site-accent": profile.accent,
    "--profile-accent": profile.accent,
    ...(image ? { backgroundImage: `linear-gradient(#0008,#0008),url("${image}")` } : {}),
  } as CSSProperties;
  return (
    <article
      className={`site-canvas site-width-${site.width} site-pattern-${site.pattern} font-${profile.font}${compact ? " site-compact" : ""}`}
      style={style}
      aria-label={profile.displayName}
    >
      <div className="site-content">{children}</div>
      {profile.showBrand && (
        <footer className="site-brand">
          {interactive ? (
            <a href="/" rel="noopener">
              Made with Ownspace
            </a>
          ) : (
            <span>Made with Ownspace</span>
          )}
        </footer>
      )}
    </article>
  );
}
