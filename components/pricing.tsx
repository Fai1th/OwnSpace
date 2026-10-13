"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { siteConfig } from "@/lib/config";
export function Pricing({ standalone = false }: { standalone?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upgrade() {
    if (!siteConfig.authEnabled) {
      window.location.assign("/studio?panel=upgrade");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/checkout", { method: "POST" });
      const data = await r.json();
      if (r.status === 401) {
        window.location.assign("/sign-in");
        return;
      }
      if (!r.ok) throw Error(data.error);
      window.location.assign(data.url);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <section id="pricing" className={"section pricing-section" + (standalone ? " standalone" : "")}>
      <div className="section-heading">
        <div>
          <div className="eyebrow">SMALL PRICE. PERSONAL SPACE.</div>
          <h2>
            Start free.
            <br />
            Make it even more yours.
          </h2>
        </div>
        <p>
          Publish a page you love for free.
          <br />
          Pay once when you want the extra detail.
        </p>
      </div>
      <div className="pricing-grid">
        <article className="price-plan">
          <span className="plan-name">Free</span>
          <h3>
            $0<span> / always</span>
          </h3>
          <p>Everything you need to have your own corner.</p>
          <Link className="button secondary" href="/studio">
            Create your page <ArrowUpRightIcon />
          </Link>
          <ul>
            {[
              "Your own profile address",
              "Four page styles",
              "Up to 20 links and six image cards",
              "Mobile-friendly pages",
              "Edit and publish whenever you like",
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
            <span className="label-badge">ONE PAYMENT</span>
          </div>
          <h3>
            {siteConfig.priceLabel}
            <span> / once · {siteConfig.currency}</span>
          </h3>
          <p>A few extra ways to make it unmistakably you.</p>
          <button className="button" onClick={upgrade} disabled={busy}>
            {busy ? "Opening checkout…" : "Unlock Premium"}
            <ArrowUpRightIcon />
          </button>
          <ul>
            {[
              "Everything in Free",
              "Your own accent color",
              "Alternate typography",
              "Grid link layout",
              "Remove Ownspace branding",
              "Premium follows your account",
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
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <p className="pricing-note">
        One page per account. Images are optimized for a fast, lightweight space.{" "}
        <Link href="/terms">Purchase terms</Link>
      </p>
    </section>
  );
}
