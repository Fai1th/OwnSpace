import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/lib/db";
import { validateHandle } from "@/lib/profile";
import { ProfileView } from "@/components/profile-view";
import { ViewTracker } from "@/components/view-tracker";
import { isLaunchBlocked } from "@/lib/deployment";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (isLaunchBlocked() || !validateHandle(handle))
    return { title: "Page not found", robots: { index: false } };
  const p = await (await getRepository()).publicProfile(handle);
  return {
    title: p ? p.displayName : "Page not found",
    description: p?.bio,
    robots: { index: false, follow: false },
  };
}
export default async function PublicProfile({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (isLaunchBlocked() || !validateHandle(handle)) notFound();
  const p = await (await getRepository()).publicProfile(handle);
  if (!p) notFound();
  return (
    <main id="main" className="public-page">
      <ProfileView profile={p} />
      <ViewTracker handle={handle} />
      <div className="public-actions">
        <Link href={"/report?handle=" + encodeURIComponent(handle)}>Report this page</Link>
        <Link href="/privacy">Privacy</Link>
      </div>
    </main>
  );
}
