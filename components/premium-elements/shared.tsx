import type { CSSProperties, ReactNode } from "react";
import type { PremiumElement, PremiumElementProps } from "../../lib/premium-elements";
import { siteLink, websiteImage } from "../../lib/site-safety";
export type ViewProps = { element: PremiumElement; interactive: boolean };
export function sectionAnchor(props: PremiumElementProps) {
  if (/^[a-zA-Z][a-zA-Z0-9-]{0,79}$/.test(props.anchor)) return props.anchor;
  if (/^[a-zA-Z0-9_-]{1,80}$/.test(props.id)) return props.id;
  return undefined;
}
export function Section({
  element,
  children,
  className = "",
}: {
  element: PremiumElement;
  children: ReactNode;
  className?: string;
}) {
  const p = element.props;
  return (
    <section
      id={sectionAnchor(p)}
      className={
        "premium-section premium-" +
        element.type.toLowerCase() +
        " premium-tone-" +
        p.variant +
        " " +
        className
      }
      style={{ textAlign: p.align, "--premium-columns": p.columns } as CSSProperties}
    >
      <div className="premium-inner">{children}</div>
    </section>
  );
}
export function Header({ element }: { element: PremiumElement }) {
  const { title, text } = element.props;
  const H = element.type === "Hero" || element.type === "SplitHero" ? "h1" : "h2";
  return (
    <>
      {title && <H className="premium-heading">{title}</H>}
      {text && <p className="premium-description">{text}</p>}
    </>
  );
}
export function Action({
  label,
  url,
  interactive,
  className = "",
}: {
  label: string;
  url: string;
  interactive: boolean;
  className?: string;
}) {
  if (!label) return null;
  const classes = "premium-action " + className;
  return interactive && url && siteLink(url) ? (
    <a className={classes} href={url}>
      {label}
      <span aria-hidden="true">↗</span>
    </a>
  ) : (
    <span className={classes}>
      {label}
      <span aria-hidden="true">↗</span>
    </span>
  );
}
export function Picture({
  image,
  title,
  className = "",
}: {
  image: string;
  title: string;
  className?: string;
}) {
  return image && websiteImage(image) ? (
    <img className={"premium-image " + className} src={image} alt={title} loading="lazy" />
  ) : (
    <div
      className={"premium-image premium-image-empty " + className}
      role="img"
      aria-label={title || "Choose an image in the editor"}
    >
      <span>{title || "Your image here"}</span>
    </div>
  );
}
export function ItemLink({
  title,
  url,
  interactive,
}: {
  title: string;
  url: string;
  interactive: boolean;
}) {
  return interactive && url && siteLink(url) ? (
    <a href={url}>
      {title}
      <span aria-hidden="true"> ↗</span>
    </a>
  ) : (
    <span>{title}</span>
  );
}
