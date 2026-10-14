import type { CSSProperties, ReactNode } from "react";
import type { WebsiteDocument, WebsiteLeaf } from "@/lib/website";
import { websiteUrl, websiteImage } from "@/lib/website";
import "./website-blocks.css";
import { PremiumElementView } from "./premium-elements";
type Size = "small" | "medium" | "large";
function responsive(size: Size, mobileSize: Size, values: Record<Size, string>): CSSProperties {
  return { "--block-desktop": values[size], "--block-mobile": values[mobileSize] } as CSSProperties;
}
export function WebsiteLeafView({
  block,
  interactive = true,
}: {
  block: WebsiteLeaf;
  interactive?: boolean;
}) {
  switch (block.type) {
    case "Heading":
      return (
        <h2
          className="website-heading website-responsive-type"
          style={{
            ...responsive(block.props.size, block.props.mobileSize, {
              small: "1.25rem",
              medium: "1.7rem",
              large: "2.3rem",
            }),
            textAlign: block.props.align,
          }}
        >
          {block.props.text}
        </h2>
      );
    case "Text":
      return (
        <p
          className="website-text website-responsive-type"
          style={{
            ...responsive(block.props.size, block.props.mobileSize, {
              small: ".875rem",
              medium: "1rem",
              large: "1.2rem",
            }),
            textAlign: block.props.align,
          }}
        >
          {block.props.text}
        </p>
      );
    case "Link":
      return (
        <div className="website-link-row" style={{ textAlign: block.props.align }}>
          {interactive && websiteUrl(block.props.url) ? (
            <a
              className="website-button"
              href={block.props.url}
              target="_blank"
              rel="noopener noreferrer nofollow ugc"
            >
              {block.props.label} <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <span className="website-button">
              {block.props.label} <span aria-hidden="true">↗</span>
            </span>
          )}
        </div>
      );
    case "Image":
      return (
        <figure className={`website-image website-image-${block.props.shape}`}>
          {block.props.image && websiteImage(block.props.image) ? (
            <img src={block.props.image} alt={block.props.alt} loading="lazy" />
          ) : (
            <div className="website-image-placeholder">Choose an image in the properties panel</div>
          )}
          {block.props.caption && <figcaption>{block.props.caption}</figcaption>}
        </figure>
      );
    case "Spacer":
      return (
        <div
          aria-hidden="true"
          className="website-spacer"
          style={responsive(block.props.size, block.props.mobileSize, {
            small: "12px",
            medium: "32px",
            large: "64px",
          })}
        />
      );
    default:
      return <PremiumElementView element={block} interactive={interactive} />;
  }
}
export function WebsiteSection({
  tone,
  padding,
  mobilePadding,
  children,
}: {
  tone: "plain" | "soft" | "outline";
  padding: Size;
  mobilePadding: Size;
  children: ReactNode;
}) {
  return (
    <section
      className={`website-section website-section-${tone}`}
      style={responsive(padding, mobilePadding, { small: "12px", medium: "24px", large: "40px" })}
    >
      {children}
    </section>
  );
}
export function WebsiteBlocks({
  document,
  interactive = true,
}: {
  document: WebsiteDocument;
  interactive?: boolean;
}) {
  return (
    <div className="website-surface" data-testid="website-content">
      {document.content.map((block) =>
        block.type === "Section" ? (
          <WebsiteSection key={block.props.id} {...block.props}>
            <div className="website-section-content">
              {block.props.content.map((child) => (
                <WebsiteLeafView key={child.props.id} block={child} interactive={interactive} />
              ))}
            </div>
          </WebsiteSection>
        ) : (
          <WebsiteLeafView key={block.props.id} block={block} interactive={interactive} />
        ),
      )}
    </div>
  );
}
