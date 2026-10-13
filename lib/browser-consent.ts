import { CONSENT_KEY, CONSENT_MAX_AGE, readSavedConsent, type Consent } from "./consent";
export function getStoredConsent(): Consent | null {
  let storage: Storage | null = null;
  let cookies = "";
  try {
    storage = window.localStorage;
  } catch {}
  try {
    cookies = document.cookie;
  } catch {}
  return readSavedConsent(storage, cookies);
}
export function persistConsent(c: Consent) {
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(c));
  } catch {}
  try {
    document.cookie =
      CONSENT_KEY +
      "=" +
      encodeURIComponent(JSON.stringify(c)) +
      "; Path=/; Max-Age=" +
      Math.floor(CONSENT_MAX_AGE / 1000) +
      "; SameSite=Lax" +
      (location.protocol === "https:" ? "; Secure" : "");
  } catch {}
}
