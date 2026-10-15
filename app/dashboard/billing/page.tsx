import { auth } from "@clerk/nextjs/server";
import { Billing } from "@/components/billing";
import { ServiceUnavailable } from "@/components/service-unavailable";
import { billingEnabled } from "@/lib/billing";
import { siteConfig } from "@/lib/config";
import { isLaunchBlocked } from "@/lib/deployment";
export const metadata = { title: "Premium & billing", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function BillingPage() {
  if (isLaunchBlocked()) return <ServiceUnavailable />;
  const configured = siteConfig.authEnabled && Boolean(process.env.CLERK_SECRET_KEY);
  if (configured) {
    const session = await auth();
    if (!session.userId) return session.redirectToSignIn({ returnBackUrl: "/dashboard/billing" });
  }
  return <Billing demo={!configured} available={billingEnabled()} />;
}
