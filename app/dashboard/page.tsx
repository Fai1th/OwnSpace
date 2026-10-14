import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { ServiceUnavailable } from "@/components/service-unavailable";
import { siteConfig } from "@/lib/config";
import { isLaunchBlocked } from "@/lib/deployment";
export const metadata = { title: "Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  if (isLaunchBlocked()) return <ServiceUnavailable />;
  const configured = siteConfig.authEnabled && Boolean(process.env.CLERK_SECRET_KEY);
  if (configured && !(await auth()).userId) redirect("/sign-in");
  return <Dashboard demo={!configured} />;
}
