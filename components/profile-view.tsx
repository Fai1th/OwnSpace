import { ArrowUpRightIcon, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { SiteCanvas } from "./site-canvas";
import type { Profile } from "@/lib/profile";
import type { ReactNode } from "react";
import { WebsiteBlocks } from "./website-blocks";
export function ProfileView({
  profile,
  compact = false,
  interactive = true,
  websiteContent,
}: {
  profile: Profile;
  compact?: boolean;
  interactive?: boolean;
  websiteContent?: ReactNode;
}) {
  const style = { "--profile-accent": profile.accent } as React.CSSProperties;
  if (profile.site?.mode === "website")
    return (
      <SiteCanvas profile={profile} compact={compact} interactive={interactive}>
        {websiteContent !== undefined
          ? websiteContent
          : profile.website && (
              <WebsiteBlocks document={profile.website} interactive={interactive} />
            )}
      </SiteCanvas>
    );
  return (
    <article
      className={`profile theme-${profile.theme} font-${profile.font} ${compact ? "compact" : ""}`}
      style={style}
    >
      {profile.theme === "desktop" && (
        <div className="window-title">
          <span className="window-dots">● ● ●</span>
          <span>{profile.handle}.space</span>
          <span>↗</span>
        </div>
      )}
      {profile.background && (
        <div className="profile-cover">
          <img src={profile.background} alt="" loading="lazy" />
        </div>
      )}
      <div className="profile-content">
        <header className="profile-header">
          {profile.avatar ? (
            <img className="profile-avatar" src={profile.avatar} alt="" loading="lazy" />
          ) : (
            <div className="profile-avatar initial-avatar">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="profile-address">@{profile.handle}</span>
          <h1>{profile.displayName}</h1>
          <p>{profile.bio}</p>
        </header>
        <div className={`profile-links layout-${profile.layout}`}>
          {profile.links
            .filter((l) => l.enabled)
            .map((link) =>
              interactive ? (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow ugc"
                >
                  <span>{link.title}</span>
                  <ArrowUpRightIcon size={18} />
                </a>
              ) : (
                <div className="profile-link" key={link.id}>
                  <span>{link.title}</span>
                  <ArrowUpRightIcon size={18} />
                </div>
              ),
            )}
        </div>
        {profile.cards.length > 0 && (
          <div className="profile-cards">
            {profile.cards.map((card) => (
              <figure key={card.id}>
                {card.image && <img src={card.image} alt={card.title} loading="lazy" />}
                <figcaption>
                  <strong>{card.title}</strong>
                  {card.caption && <span>{card.caption}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
        {websiteContent !== undefined
          ? websiteContent
          : profile.website && (
              <WebsiteBlocks document={profile.website} interactive={interactive} />
            )}
        {profile.showBrand &&
          (interactive ? (
            <a className="profile-brand" href="/studio">
              Make your own space <ArrowRightIcon size={13} />
            </a>
          ) : (
            <span className="profile-brand">
              Make your own space <ArrowRightIcon size={13} />
            </span>
          ))}
      </div>
    </article>
  );
}
