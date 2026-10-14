import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { WebsiteEditorLoader } from "@/components/website-editor-loader";
import { ServiceUnavailable } from "@/components/service-unavailable";
import { siteConfig } from "@/lib/config";
import { isLaunchBlocked } from "@/lib/deployment";
export const metadata = { title: "Website editor", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ handle?: string }>;
}) {
  if (isLaunchBlocked()) return <ServiceUnavailable />;
  const configured = siteConfig.authEnabled && Boolean(process.env.CLERK_SECRET_KEY);
  if (configured && !(await auth()).userId) {
    const { handle } = await searchParams;
    const target = "/editor" + (handle ? "?handle=" + encodeURIComponent(handle.slice(0, 30)) : "");
    redirect("/sign-in?redirect_url=" + encodeURIComponent(target));
  }
  return <WebsiteEditorLoader demo={!configured} />;
}
