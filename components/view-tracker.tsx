"use client";
import { useEffect } from "react";
import { allowsTracking } from "@/lib/consent";
import { getStoredConsent } from "@/lib/browser-consent";
export function ViewTracker({ handle }: { handle: string }) {
  useEffect(() => {
    let sent = false;
    function track() {
      if (sent) return;
      if (
        allowsTracking(getStoredConsent(), "analytics", Boolean(navigator.globalPrivacyControl))
      ) {
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
