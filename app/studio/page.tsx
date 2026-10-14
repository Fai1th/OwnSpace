import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { StudioEditor } from "@/components/studio-editor";
import { siteConfig } from "@/lib/config";
import { isLaunchBlocked } from "@/lib/deployment";
import { ServiceUnavailable } from "@/components/service-unavailable";
export const metadata = { title: "Your space", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function Studio() {
  if (isLaunchBlocked()) return <ServiceUnavailable />;
  const configured = siteConfig.authEnabled && Boolean(process.env.CLERK_SECRET_KEY);
  if (configured) {
    const session = await auth();
    if (!session.userId) redirect("/sign-in");
  }
  return <StudioEditor demo={!configured} />;
}
