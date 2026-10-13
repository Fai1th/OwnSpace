import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
export default function NotFound() {
  return (
    <>
      <Navigation />
      <main id="main" className="error-page">
        <span className="eyebrow">PAGE NOT FOUND</span>
        <h1>This space isn’t here.</h1>
        <p>The address may have changed, or its owner may have taken the page offline.</p>
        <Link className="button" href="/">
          Back to Ownspace
        </Link>
      </main>
      <Footer />
    </>
  );
}
