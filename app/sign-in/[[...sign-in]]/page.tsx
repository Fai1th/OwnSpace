import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { siteConfig } from "@/lib/config";
import { isLaunchBlocked } from "@/lib/deployment";
import { ServiceUnavailable } from "@/components/service-unavailable";
export const metadata = { title: "Sign in", robots: { index: false } };
export default function Page() {
  if (isLaunchBlocked()) return <ServiceUnavailable />;
  return (
    <>
      <Navigation />
      <main id="main" className="auth-page">
        {siteConfig.authEnabled ? (
          <SignIn />
        ) : (
          <div className="auth-placeholder">
            <h1>Your space starts here.</h1>
            <p>
              Sign-in is currently unavailable. You can explore the editor and keep a draft in this
              browser.
            </p>
            <Link className="button" href="/studio">
              Explore the editor
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
