import { useId, useState } from "react";
import { Action, Header, ItemLink, Picture, Section } from "./shared";
import type { ViewProps } from "./shared";
import { siteLink } from "../../lib/site-safety";

export function StructureView({ element, interactive }: ViewProps) {
  const p = element.props;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  switch (element.type) {
    case "SiteNav":
      return (
        <Section element={element}>
          <nav
            className="premium-navigation"
            aria-label={p.title ? p.title + " navigation" : "Site navigation"}
          >
            <strong className="premium-brand">{p.title}</strong>
            {interactive && (
              <button
                className="premium-menu-toggle"
                type="button"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? "Close" : "Menu"}
              </button>
            )}
            <div id={menuId} className={"premium-nav-links " + (menuOpen ? "is-open" : "")}>
              {p.items.map((item, i) => (
                <ItemLink key={i} title={item.title} url={item.url} interactive={interactive} />
              ))}
            </div>
            <Action label={p.label} url={p.url} interactive={interactive} />
          </nav>
        </Section>
      );
    case "Hero":
      return (
        <Section element={element}>
          <div className="premium-hero-copy">
            <Header element={element} />
            <Action label={p.label} url={p.url} interactive={interactive} />
          </div>
          {p.image && <Picture image={p.image} title={p.title} className="premium-hero-art" />}
        </Section>
      );
    case "SplitHero":
      return (
        <Section element={element}>
          <div className="premium-split">
            <div>
              <Header element={element} />
              <Action label={p.label} url={p.url} interactive={interactive} />
            </div>
            <Picture image={p.image} title={p.title} />
          </div>
        </Section>
      );
    case "CallToAction":
      return (
        <Section element={element}>
          <Header element={element} />
          <Action label={p.label} url={p.url} interactive={interactive} />
        </Section>
      );
    case "Announcement":
      return (
        <Section element={element}>
          <div className="premium-announcement-row">
            <div>
              <Header element={element} />
            </div>
            <Action label={p.label} url={p.url} interactive={interactive} />
          </div>
        </Section>
      );
    case "Contact":
      return (
        <Section element={element}>
          <Header element={element} />
          {p.email &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) &&
            (interactive ? (
              <a className="premium-action" href={"mailto:" + encodeURIComponent(p.email)}>
                {p.label || p.email}
                <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <span className="premium-action">{p.label || p.email}</span>
            ))}
        </Section>
      );
    case "SiteFooter":
      return (
        <Section element={element}>
          <footer className="premium-footer-row">
            <div>
              <Header element={element} />
            </div>
            <nav aria-label="Footer links">
              {p.items.map((item, i) => (
                <ItemLink key={i} title={item.title} url={item.url} interactive={interactive} />
              ))}
            </nav>
          </footer>
        </Section>
      );
    case "Divider":
      return (
        <Section element={element}>
          <div className="premium-divider">
            <span />
            {p.label && <span>{p.label}</span>}
            <span />
          </div>
        </Section>
      );
    default:
      return null;
  }
}
export function ContentView({ element, interactive }: ViewProps) {
  const p = element.props;
  switch (element.type) {
    case "FeatureGrid":
      return (
        <Section element={element}>
          <Header element={element} />
          <div className="premium-grid premium-feature-grid">
            {p.items.map((item, i) => (
              <article key={i}>
                <span className="premium-index">{String(i + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                {item.url && <Action label="Learn more" url={item.url} interactive={interactive} />}
              </article>
            ))}
          </div>
        </Section>
      );
    case "Cards":
    case "ProjectGrid":
      return (
        <Section element={element}>
          <Header element={element} />
          <div className="premium-grid">
            {p.items.map((item, i) => (
              <article className="premium-card" key={i}>
                {(item.image || element.type === "ProjectGrid") && (
                  <Picture image={item.image} title={item.title} />
                )}
                <div className="premium-card-copy">
                  <h3>
                    <ItemLink title={item.title} url={item.url} interactive={interactive} />
                  </h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </Section>
      );
    case "PricingTable":
      return (
        <Section element={element}>
          <Header element={element} />
          <div className="premium-grid premium-pricing-grid">
            {p.items.map((item, i) => {
              const [price, ...features] = item.text.split("\n");
              return (
                <article className="premium-price" key={i}>
                  <h3>{item.title}</h3>
                  <p className="premium-price-value">{price}</p>
                  <ul>
                    {features.filter(Boolean).map((line, n) => (
                      <li key={n}>{line}</li>
                    ))}
                  </ul>
                  <Action label={p.label} url={item.url} interactive={interactive} />
                </article>
              );
            })}
          </div>
        </Section>
      );
    case "Stats":
      return (
        <Section element={element}>
          <Header element={element} />
          <dl className="premium-grid premium-stats-grid">
            {p.items.map((item, i) => (
              <div key={i}>
                <dt>{item.text}</dt>
                <dd>{item.title}</dd>
              </div>
            ))}
          </dl>
        </Section>
      );
    case "Timeline":
      return (
        <Section element={element}>
          <Header element={element} />
          <ol className="premium-timeline">
            {p.items.map((item, i) => (
              <li key={i}>
                <span className="premium-timeline-dot" aria-hidden="true" />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      );
    case "Quote":
      return (
        <Section element={element}>
          <figure className="premium-quote">
            <span className="premium-quote-mark" aria-hidden="true">
              “
            </span>
            <blockquote>
              <p>{p.text}</p>
            </blockquote>
            <figcaption>
              {p.image && <Picture image={p.image} title={p.title} />}
              <strong>{p.title}</strong>
              {p.label && <span>{p.label}</span>}
            </figcaption>
          </figure>
        </Section>
      );
    case "Badge":
      return (
        <Section element={element}>
          <span className="premium-badge">
            <span aria-hidden="true" />
            {p.label}
          </span>
        </Section>
      );
    case "Checklist":
      return (
        <Section element={element}>
          <Header element={element} />
          <ul className="premium-checklist">
            {p.items.map((item, i) => (
              <li key={i}>
                <span className="premium-check" aria-hidden="true">
                  ✓
                </span>
                <div>
                  <strong>{item.title}</strong>
                  {item.text && <p>{item.text}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      );
    case "Steps":
      return (
        <Section element={element}>
          <Header element={element} />
          <ol className="premium-grid premium-steps">
            {p.items.map((item, i) => (
              <li key={i}>
                <span className="premium-step-number" aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ol>
        </Section>
      );
    case "SocialLinks":
      return (
        <Section element={element}>
          <Header element={element} />
          <ul className="premium-social-links">
            {p.items.map((item, i) => (
              <li key={i}>
                {interactive && item.url && siteLink(item.url) ? (
                  <a href={item.url}>
                    <strong>{item.title}</strong>
                    {item.text && <span>{item.text}</span>}
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <div>
                    <strong>{item.title}</strong>
                    {item.text && <span>{item.text}</span>}
                    <span aria-hidden="true">↗</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Section>
      );
    default:
      return null;
  }
}
