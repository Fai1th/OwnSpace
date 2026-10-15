"use client";
import Link from "next/link";
import { CheckIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { siteConfig } from "@/lib/config";
export function Pricing({ standalone = false }: { standalone?: boolean }) {
  return (
    <section id="pricing" className={"section pricing-section" + (standalone ? " standalone" : "")}>
      <div className="section-heading">
        <h2>A simple start. More room with Premium.</h2>
        <p>
          Free covers a small website. One payment unlocks the component library and more control
          over your design.
        </p>
      </div>
      <div className="pricing-grid">
        <article className="price-plan">
          <span className="plan-name">Free</span>
          <h3>
            $0<span> / always</span>
          </h3>
          <p>A small website with the essentials.</p>
          <Link className="button secondary" href="/editor">
            Create a free website <ArrowUpRightIcon />
          </Link>
          <ul>
            {[
              "1 website with up to 6 basic blocks",
              "Up to 3 links and 1 content image",
              "Headings, text, images and buttons",
              "Fixed neutral style with Ownspace branding",
              "Private drafts, previews and publishing",
            ].map((t) => (
              <li key={t}>
                <CheckIcon />
                {t}
              </li>
            ))}
          </ul>
        </article>
        <article className="price-plan premium-plan">
          <div className="plan-header">
            <span className="plan-name">Premium</span>
            <span className="label-badge">One payment</span>
          </div>
          <h3>
            {siteConfig.priceLabel}
            <span> / once · {siteConfig.currency}</span>
          </h3>
          <p>The full library, more blocks and your own design.</p>
          <Link className="button" href="/dashboard/billing">
            Unlock Premium
            <ArrowUpRightIcon />
          </Link>
          <ul>
            {[
              "30+ components in the Premium library",
              "Up to 40 blocks per website",
              "Navigation, galleries, layouts and interactions",
              "Custom backgrounds, patterns and styles",
              "Remove Ownspace branding",
              "Export your website as React source",
            ].map((t) => (
              <li key={t}>
                <CheckIcon />
                {t}
              </li>
            ))}
          </ul>
          <small>No subscription. Taxes, if applicable, shown at checkout.</small>
        </article>
      </div>
      <p className="pricing-note">
        One website per account. Premium is a one-time purchase.{" "}
        <Link href="/terms">Purchase terms</Link>
      </p>
    </section>
  );
}
