import Link from "next/link";
import { Navigation } from "./navigation";
import { Footer } from "./footer";
export function ServiceUnavailable() {
  return (
    <>
      <Navigation />
      <main id="main" className="auth-page">
        <div className="auth-placeholder">
          <h1>Account access is being configured.</h1>
          <p>
            You can explore Ownspace while account features are unavailable. Check back to create or
            manage your space.
          </p>
          <Link className="button" href="/#explore">
            Explore the page styles
          </Link>
          <p>
            <Link href="/legal">Policies and privacy choices</Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
