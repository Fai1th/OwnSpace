export const CONSENT_KEY = "ownspace-consent";
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000;
export type Consent = {
  version: number;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: number;
};
export function makeConsent(analytics: boolean, marketing: boolean, now = Date.now()): Consent {
  return { version: CONSENT_VERSION, necessary: true, analytics, marketing, updatedAt: now };
}
export function readConsent(raw: string | null, now = Date.now()): Consent | null {
  try {
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (
      c.version !== CONSENT_VERSION ||
      c.necessary !== true ||
      typeof c.analytics !== "boolean" ||
      typeof c.marketing !== "boolean" ||
      typeof c.updatedAt !== "number" ||
      c.updatedAt > now + 60000 ||
      now - c.updatedAt > CONSENT_MAX_AGE
    )
      return null;
    return c;
  } catch {
    return null;
  }
}
export function allowsTracking(
  c: Consent | null,
  category: "analytics" | "marketing",
  gpc: boolean,
) {
  return !gpc && Boolean(c?.[category]);
}
