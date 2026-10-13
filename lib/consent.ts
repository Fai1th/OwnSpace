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
export function readSavedConsent(
  storage: Pick<Storage, "getItem"> | null,
  cookieHeader: string,
  now = Date.now(),
): Consent | null {
  let local: Consent | null = null,
    cookie: Consent | null = null;
  try {
    local = readConsent(storage?.getItem(CONSENT_KEY) || null, now);
  } catch {}
  try {
    const part = cookieHeader
      .split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith(CONSENT_KEY + "="));
    if (part) cookie = readConsent(decodeURIComponent(part.slice(CONSENT_KEY.length + 1)), now);
  } catch {}
  if (!local) return cookie;
  if (!cookie) return local;
  if (local.updatedAt === cookie.updatedAt)
    return {
      ...local,
      analytics: local.analytics && cookie.analytics,
      marketing: local.marketing && cookie.marketing,
    };
  return local.updatedAt > cookie.updatedAt ? local : cookie;
}
export function allowsTracking(
  c: Consent | null,
  category: "analytics" | "marketing",
  gpc: boolean,
) {
  return !gpc && Boolean(c?.[category]);
}
