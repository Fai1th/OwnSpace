export const siteConfig = {
  name: "Ownspace",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  authEnabled: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
  priceLabel: process.env.NEXT_PUBLIC_PREMIUM_PRICE_LABEL || "$12",
  currency: process.env.NEXT_PUBLIC_CURRENCY || "USD",
  priceAmount: Number(process.env.NEXT_PUBLIC_PREMIUM_PRICE_AMOUNT || "1200"),
  operator: process.env.NEXT_PUBLIC_LEGAL_OPERATOR || "",
  contact: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "",
  jurisdiction: process.env.NEXT_PUBLIC_LEGAL_JURISDICTION || "",
  hosting: process.env.NEXT_PUBLIC_HOSTING_PROVIDER || "",
  database: process.env.NEXT_PUBLIC_DATABASE_PROVIDER || "",
  region: process.env.NEXT_PUBLIC_DATA_REGION || "",
  logDays: Number(process.env.NEXT_PUBLIC_LOG_RETENTION_DAYS || "30"),
  backupDays: Number(process.env.NEXT_PUBLIC_BACKUP_RETENTION_DAYS || "30"),
  financialYears: Number(process.env.NEXT_PUBLIC_FINANCIAL_RETENTION_YEARS || "7"),
  minimumAge: Number(process.env.NEXT_PUBLIC_MINIMUM_AGE || "16"),
  gaId: process.env.NEXT_PUBLIC_GA_ID || "",
  metaPixel: process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
  termsDate: process.env.NEXT_PUBLIC_LEGAL_EFFECTIVE_DATE || "2026-10-14",
  paymentPollDelayMs: publicInteger(
    process.env.NEXT_PUBLIC_PAYMENT_POLL_DELAY_MS,
    2500,
    1000,
    10000,
  ),
  paymentPollAttempts: publicInteger(process.env.NEXT_PUBLIC_PAYMENT_POLL_ATTEMPTS, 10, 1, 20),
};
function publicInteger(value: string | undefined, fallback: number, min: number, max: number) {
  const n = Number(value);
  return value && Number.isInteger(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
export function getSiteUrl() {
  const url = new URL(siteConfig.url);
  if (
    process.env.NODE_ENV === "production" &&
    process.env.OWNSPACE_LOCAL_PREVIEW !== "1" &&
    url.protocol !== "https:"
  )
    throw Error("NEXT_PUBLIC_SITE_URL must use HTTPS in production.");
  return url.origin;
}
