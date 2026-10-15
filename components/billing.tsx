"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { AgreementNotice } from "./agreement-notice";
import { Logo } from "./logo";
import { siteConfig } from "@/lib/config";
import "./dashboard.css";
import "./billing.css";
export function Billing({ demo, available }: { demo: boolean; available: boolean }) {
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [checking, setChecking] = useState(!demo);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (demo) {
      setChecking(false);
      return;
    }
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const returned = new URLSearchParams(location.search).get("purchase");
    if (returned === "cancelled")
      setMessage("Checkout cancelled. Your website and plan are unchanged.");
    if (returned === "complete") setPending(true);
    setError("");
    const check = async (count: number) => {
      setChecking(true);
      try {
        const response = await fetch("/api/billing", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw Error(data.error || "Payment status could not be checked.");
        if (controller.signal.aborted) return;
        const next = data.entitlement || "free";
        setStatus(next);
        if (next === "paid") {
          setPending(false);
          setMessage(
            "Premium is active. The full library, custom styles and React source export are ready.",
          );
        } else if (
          ["refunded", "disputed", "dispute_lost"].includes(next) &&
          data.payment !== "pending"
        ) {
          setPending(false);
          setMessage(
            next === "disputed"
              ? "This purchase is suspended while its payment dispute is open."
              : "Your previous upgrade is no longer active. Contact support if you need help.",
          );
        } else if (data.payment === "failed" || data.payment === "expired") {
          setPending(false);
          setMessage(
            data.payment === "failed"
              ? "The payment did not complete. You can try checkout again."
              : "The checkout expired. Start a new checkout when you're ready.",
          );
        } else if (data.payment === "pending" || returned === "complete") {
          setPending(true);
          setMessage("Your payment is being confirmed. You can keep working; check again shortly.");
          if (count < siteConfig.paymentPollAttempts) {
            timer = setTimeout(() => void check(count + 1), siteConfig.paymentPollDelayMs);
            return;
          }
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setError(error instanceof Error ? error.message : "Payment status could not be checked.");
      }
      if (!controller.signal.aborted) setChecking(false);
    };
    void check(1);
    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [demo, attempt]);
  async function upgrade() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 428)
          document.getElementById("billing-agreement")?.scrollIntoView?.({ behavior: "smooth" });
        if (response.status === 409) setPending(true);
        throw Error(data.error || "Checkout could not be opened.");
      }
      location.assign(data.url);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Couldn't connect. Please try again.");
      setBusy(false);
    }
  }
  const paid = status === "paid";
  return (
    <main id="main" className="dashboard-shell billing-shell">
      <header className="dashboard-header">
        <Logo />
        <span>Premium & billing</span>
        <Link href="/dashboard">Dashboard</Link>
        {!demo && <UserButton />}
      </header>
      <section className="dashboard-welcome">
        <div>
          <h1>Your plan.</h1>
          <p>One payment for the full website builder. No subscription.</p>
        </div>
        <Link className="dashboard-main-button" href="/editor">
          Open website editor ↗
        </Link>
      </section>
      <div className="billing-grid">
        <section className="billing-plan" aria-labelledby="billing-plan-title">
          <div className="billing-plan-heading">
            <h2 id="billing-plan-title">Premium</h2>
            <span>
              {demo
                ? "Preview"
                : status === null
                  ? "Checking plan…"
                  : paid
                    ? "Active"
                    : "Not active"}
            </span>
          </div>
          <p className="billing-price">
            {siteConfig.priceLabel}
            <span> {siteConfig.currency} · once</span>
          </p>
          <p>More room to build a website that feels like yours.</p>
          <ul>
            <li>30+ reusable components and up to 40 blocks</li>
            <li>Custom backgrounds, patterns, colors and layouts</li>
            <li>Remove Ownspace branding</li>
            <li>Download an editable React website</li>
          </ul>
          {demo ? (
            <Link className="button" href="/sign-in?redirect_url=%2Fdashboard%2Fbilling">
              Sign in to upgrade
            </Link>
          ) : paid ? (
            <Link className="button" href="/editor">
              Use Premium in the editor
            </Link>
          ) : !available ? (
            <p className="field-help">
              Purchases are temporarily unavailable. You can continue editing on Free.
            </p>
          ) : (
            <button
              className="button"
              disabled={busy || status === null || checking || pending || status === "disputed"}
              onClick={upgrade}
            >
              {busy ? "Opening checkout…" : "Continue to secure checkout"}
            </button>
          )}
          <p className="billing-fine">
            Payment is handled by Stripe. Review the final total before paying.
          </p>
          <p className="billing-fine">
            <Link href="/terms">Purchase terms</Link> ·{" "}
            <Link href="/refunds">Refunds & cancellations</Link> ·{" "}
            <Link href="/privacy">Privacy notice</Link>
          </p>
        </section>
        <section className="billing-status" aria-labelledby="billing-status-title">
          <h2 id="billing-status-title">Payment status</h2>
          <div role="status" aria-live="polite">
            <p>
              {demo
                ? "Payments are unavailable in this browser preview."
                : message ||
                  (checking
                    ? "Checking your account…"
                    : "You're on Free. Upgrade whenever you're ready.")}
            </p>
          </div>
          {!demo && (
            <button
              className="button secondary"
              disabled={checking || busy}
              onClick={() => setAttempt((value) => value + 1)}
            >
              {checking ? "Checking payment…" : "Check payment status"}
            </button>
          )}
          {pending && (
            <p className="billing-fine">
              Please check the existing payment before starting another checkout.
            </p>
          )}
          {siteConfig.contact && (
            <p className="billing-fine">
              <a href={"mailto:" + siteConfig.contact}>Contact support</a> for payment help.
            </p>
          )}
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
        </section>
      </div>
      {!demo && (
        <section id="billing-agreement" className="dashboard-agreement">
          <AgreementNotice />
        </section>
      )}
      <footer className="dashboard-footer">
        <span>Ownspace</span>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/legal">Legal center</Link>
      </footer>
    </main>
  );
}
