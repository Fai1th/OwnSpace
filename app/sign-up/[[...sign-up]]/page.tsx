import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { siteConfig } from "@/lib/config";
import { isLaunchBlocked } from "@/lib/deployment";
import { ServiceUnavailable } from "@/components/service-unavailable";
export const metadata = { title: "Create an account", robots: { index: false } };
export default function Page() {
  if (isLaunchBlocked()) return <ServiceUnavailable />;
  return (
    <>
      <Navigation />
      <main id="main" className="auth-page">
        {siteConfig.authEnabled ? (
          <div>
            <SignUp />
            <p className="field-help">
              By creating an account, you agree to our <Link href="/terms">Terms</Link> and confirm
              you meet the minimum age requirement.
            </p>
          </div>
        ) : (
          <div className="auth-placeholder">
            <h1>A little space. All yours.</h1>
            <p>
              Try the editor and keep your draft here. Account creation is currently unavailable.
            </p>
            <Link className="button" href="/studio">
              Make your space
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
