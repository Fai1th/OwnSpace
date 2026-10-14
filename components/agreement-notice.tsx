"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
export function AgreementNotice() {
  const [version, setVersion] = useState(""),
    [accepted, setAccepted] = useState(false),
    [terms, setTerms] = useState(false),
    [age, setAge] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/agreement", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw Error(result.error || "Your agreement status could not be loaded.");
        setVersion(result.version);
        setAccepted(result.accepted);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      });
    return () => controller.abort();
  }, [attempt]);
  if (accepted)
    return (
      <p className="field-help">
        Current Terms accepted. <Link href="/legal">Review policies and privacy choices</Link>.
      </p>
    );
  return (
    <section className="setting-box" aria-labelledby="agreement-title">
      <h2 id="agreement-title">Before you publish.</h2>
      <p>
        You can work on a private draft now. Review the service agreement before publishing a page
        or purchasing an upgrade.
      </p>
      <p>
        <Link href="/terms">Terms of use</Link> · <Link href="/acceptable-use">Acceptable use</Link>{" "}
        · <Link href="/privacy">Privacy notice</Link>
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            const response = await fetch("/api/agreement", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ version, acceptedTerms: terms, ageConfirmed: age }),
            });
            const data = await response.json();
            if (!response.ok) throw Error(data.error || "Your agreement could not be saved.");
            setAccepted(true);
          } catch (error) {
            setError((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="field-group">
          <span>
            <input
              type="checkbox"
              checked={terms}
              onChange={(event) => setTerms(event.target.checked)}
            />{" "}
            I agree to the Terms of use and Acceptable use policy.
          </span>
        </label>
        <label className="field-group">
          <span>
            <input
              type="checkbox"
              checked={age}
              onChange={(event) => setAge(event.target.checked)}
            />{" "}
            I am at least {siteConfig.minimumAge} and meet the Terms’ age and consent requirements
            where I live.
          </span>
        </label>
        <p className="field-help">
          The privacy notice explains data use. This does not opt you into analytics or marketing
          cookies.
        </p>
        <button className="button small" disabled={!version || !terms || !age || busy}>
          {busy ? "Saving…" : "Save agreement"}
        </button>
      </form>
      {error && (
        <p role="alert" className="error-text">
          {error}{" "}
          {!version && (
            <button
              className="text-link"
              onClick={() => {
                setError("");
                setAttempt((value) => value + 1);
              }}
            >
              Retry
            </button>
          )}
        </p>
      )}
    </section>
  );
}
