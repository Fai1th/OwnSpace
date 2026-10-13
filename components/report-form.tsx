"use client";
import { useEffect, useState } from "react";
export function ReportForm() {
  const [handle, setHandle] = useState(""),
    [reason, setReason] = useState("other"),
    [details, setDetails] = useState(""),
    [website, setWebsite] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    setHandle(new URLSearchParams(location.search).get("handle") || "");
  }, []);
  return (
    <form
      className="report-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const r = await fetch("/api/report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ handle, reason, details, website }),
          });
          const data = await r.json();
          if (!r.ok) throw Error(data.error);
          setMessage("Your report has been received for review.");
          setDetails("");
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Page address
        <input
          className="native-input"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          required
          maxLength={30}
        />
      </label>
      <label>
        Reason
        <select className="native-input" value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="harassment">Harassment or threats</option>
          <option value="illegal-content">Illegal content</option>
          <option value="impersonation">Impersonation or scam</option>
          <option value="copyright">Copyright concern</option>
          <option value="other">Something else</option>
        </select>
      </label>
      <label>
        What should we know?
        <textarea
          className="native-input"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          minLength={10}
          maxLength={2000}
          required
        />
      </label>
      <label style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        Website
        <input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </label>
      <button className="button" disabled={busy}>
        {busy ? "Sending…" : "Send report"}
      </button>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="success-text" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
