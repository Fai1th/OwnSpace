import Link from "next/link";
import { notFound } from "next/navigation";
import { websiteExamples as examples } from "@/lib/website-examples";
import { ProfileView } from "@/components/profile-view";
export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return { title: "Example space · " + handle, robots: { index: false, follow: false } };
}
export default async function Example({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const p = examples.find((x) => x.handle === handle);
  if (!p) notFound();
  return (
    <main id="main" className="public-page">
      <div className="example-bar">
        <span>Example space · {p.displayName}</span>
        <Link href="/editor">Open website editor →</Link>
      </div>
      <ProfileView profile={p} interactive />
      <div className="public-actions">
        <Link href="/">Back to Ownspace</Link>
        <Link href="/editor">Make your own space</Link>
      </div>
    </main>
  );
}
