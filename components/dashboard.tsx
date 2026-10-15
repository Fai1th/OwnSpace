"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Logo } from "./logo";
import { AgreementNotice } from "./agreement-notice";
import { ProfileView } from "./profile-view";
import { emptyProfile, sanitizeProfile, type ProfileRecord } from "@/lib/profile";
import { readDraft } from "@/lib/draft";
import "./dashboard.css";
export function Dashboard({ demo }: { demo: boolean }) {
  const [record, setRecord] = useState<ProfileRecord | null>(null);
  const [local, setLocal] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    (async () => {
      try {
        if (demo) {
          try {
            const value = readDraft(localStorage.getItem("ownspace-draft-v1"));
            if (value && live) setLocal(value);
          } catch {}
        } else {
          const response = await fetch("/api/profile", { cache: "no-store" });
          const result = await response.json();
          if (!response.ok) throw Error(result.error || "Unable to load your website.");
          if (live) setRecord(result.profile);
        }
      } catch (error) {
        if (live) setError(error instanceof Error ? error.message : "Unable to load your website.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [demo, attempt]);
  const page = record?.draft || local;
  const changed =
    !!record?.published && JSON.stringify(record.draft) !== JSON.stringify(record.published);
  return (
    <main className="dashboard-shell" id="main">
      <header className="dashboard-header">
        <Logo />
        <span>Your workspace</span>
        <Link href="/legal">Policies & privacy</Link>
        {!demo && <UserButton />}
      </header>
      <section className="dashboard-welcome">
        <div>
          <h1>Manage your website.</h1>
          <p>Edit your draft, preview changes and publish when ready.</p>
        </div>
        <Link className="dashboard-main-button" href="/editor">
          Edit website <span aria-hidden="true">↗</span>
        </Link>
      </section>
      {demo && (
        <p className="dashboard-demo">
          Private browser demo. Your drafts stay on this device.{" "}
          <Link href="/sign-in">Sign in</Link> to save to an account.
        </p>
      )}
      {error && (
        <p role="alert" className="dashboard-error">
          {error}{" "}
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>
            Try again
          </button>
        </p>
      )}
      <div className="dashboard-grid">
        <section className="dashboard-site">
          <div className="dashboard-section-heading">
            <h2>Your website</h2>
            <span className="dashboard-status">
              {loading
                ? "Loading…"
                : demo
                  ? "Browser draft"
                  : record?.published
                    ? changed
                      ? "Published · draft changes"
                      : "Published"
                    : "Private draft"}
            </span>
          </div>
          <div className="dashboard-site-body">
            <div className="dashboard-thumbnail">
              <ProfileView
                profile={sanitizeProfile(page, record?.entitlement === "paid")}
                compact
                interactive={false}
              />
            </div>
            <div className="dashboard-site-info">
              <h3>{page.displayName}</h3>
              <p>{record ? `/${record.handle}` : "Choose your website address in the editor."}</p>
              <p>
                {record?.published
                  ? "Your published website stays live while you edit your draft."
                  : "Your website is private until you publish it."}
              </p>
              <Link className="dashboard-main-button" href="/editor">
                Open visual editor <span aria-hidden="true">↗</span>
              </Link>
              {record?.published && (
                <Link
                  href={`/${record.published.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View published website ↗
                </Link>
              )}
              {record && (
                <small>
                  Last saved {new Date(record.updatedAt).toLocaleDateString()} · version{" "}
                  {record.version}
                </small>
              )}
            </div>
          </div>
        </section>
        <aside className="dashboard-tools">
          <h2>Website tools</h2>
          <Link href="/studio">
            <strong>
              Website settings <span aria-hidden="true">↗</span>
            </strong>
            <span>Address, profile details and publishing controls.</span>
          </Link>
          <Link href="/dashboard/billing">
            <strong>
              Premium & billing <span aria-hidden="true">↗</span>
            </strong>
            <span>One-time upgrade and payment confirmation.</span>
          </Link>
          <Link href="/studio?panel=settings">
            <strong>
              Account & settings <span aria-hidden="true">↗</span>
            </strong>
            <span>Premium, data export and deletion controls.</span>
          </Link>
          <Link href="/privacy-choices">
            <strong>
              Privacy choices <span aria-hidden="true">↗</span>
            </strong>
            <span>Cookies, personal data and your available controls.</span>
          </Link>
        </aside>
      </div>
      {!demo && (
        <section className="dashboard-agreement">
          <AgreementNotice />
        </section>
      )}
      <footer className="dashboard-footer">
        <span>Ownspace workspace</span>
        <Link href="/legal">Legal center</Link>
        <Link href="/studio">Website settings</Link>
      </footer>
    </main>
  );
}
