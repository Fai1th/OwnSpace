"use client";
import { useEffect } from "react";
import { readConsent, allowsTracking, CONSENT_KEY } from "@/lib/consent";
export function ViewTracker({ handle }: { handle: string }) {
  useEffect(() => {
    let sent = false;
    function track() {
      if (sent) return;
      let raw = null;
      try {
        raw = localStorage.getItem(CONSENT_KEY);
      } catch {}
      if (allowsTracking(readConsent(raw), "analytics", Boolean(navigator.globalPrivacyControl))) {
        sent = true;
        void fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handle }),
        });
      }
    }
    track();
    window.addEventListener("ownspace-consent-changed", track);
    return () => window.removeEventListener("ownspace-consent-changed", track);
  }, [handle]);
  return null;
}
