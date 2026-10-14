export const requiredProductionEnv = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "CLERK_WEBHOOK_SIGNING_SECRET",
  "DATABASE_URL",
  "NEXT_PUBLIC_LEGAL_OPERATOR",
  "NEXT_PUBLIC_LEGAL_ADDRESS",
  "NEXT_PUBLIC_SUPPORT_EMAIL",
  "NEXT_PUBLIC_LEGAL_JURISDICTION",
  "NEXT_PUBLIC_HOSTING_PROVIDER",
  "NEXT_PUBLIC_DATABASE_PROVIDER",
  "NEXT_PUBLIC_DATA_REGION",
] as const;
export function isLaunchBlocked(env: Record<string, string | undefined> = process.env) {
  const hosted =
    env.VERCEL === "1" || (env.NODE_ENV === "production" && env.OWNSPACE_LOCAL_PREVIEW !== "1");
  return hosted && deploymentIssues(env).length > 0;
}
export function deploymentIssues(env: Record<string, string | undefined>) {
  const issues: string[] = requiredProductionEnv.filter((k) => !env[k]?.trim());
  for (const group of [
    ["STRIPE_SECRET_KEY", "STRIPE_PREMIUM_PRICE_ID", "STRIPE_WEBHOOK_SECRET"],
    ["COMPOSIO_API_KEY", "COMPOSIO_GITHUB_AUTH_CONFIG_ID"],
  ])
    if (group.some((k) => env[k])) for (const key of group) if (!env[key]) issues.push(key);
  if (env.NEXT_PUBLIC_SITE_URL) {
    try {
      const url = new URL(env.NEXT_PUBLIC_SITE_URL);
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1"
      )
        issues.push("NEXT_PUBLIC_SITE_URL must be a public HTTPS origin");
    } catch {
      issues.push("NEXT_PUBLIC_SITE_URL is not a valid URL");
    }
  }
  if (
    env.NEXT_PUBLIC_SUPPORT_EMAIL &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.NEXT_PUBLIC_SUPPORT_EMAIL)
  )
    issues.push("NEXT_PUBLIC_SUPPORT_EMAIL must be valid");
  if (
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !/^pk_(test|live)_/.test(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
  )
    issues.push("Invalid Clerk publishable key format");
  if (env.CLERK_SECRET_KEY && !/^sk_(test|live)_/.test(env.CLERK_SECRET_KEY))
    issues.push("Invalid Clerk secret key format");
  if (env.NEXT_PUBLIC_GA_ID && !/^G-[A-Z0-9]+$/.test(env.NEXT_PUBLIC_GA_ID))
    issues.push("Invalid Google Analytics ID");
  if (env.NEXT_PUBLIC_META_PIXEL_ID && !/^\d+$/.test(env.NEXT_PUBLIC_META_PIXEL_ID))
    issues.push("Invalid Meta Pixel ID");
  if (
    env.NEXT_PUBLIC_MINIMUM_AGE &&
    (!Number.isInteger(Number(env.NEXT_PUBLIC_MINIMUM_AGE)) ||
      Number(env.NEXT_PUBLIC_MINIMUM_AGE) < 16)
  )
    issues.push("Minimum age must be at least 16");
  return [...new Set(issues)];
}
