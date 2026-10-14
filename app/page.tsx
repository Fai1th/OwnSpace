import Link from "next/link";
import {
  ArrowUpRightIcon,
  SquaresFourIcon,
  SlidersHorizontalIcon,
  GlobeSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Navigation } from "@/components/navigation";
import { Hero } from "@/components/hero";
import { Gallery } from "@/components/gallery";
import { Pricing } from "@/components/pricing";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Navigation />
      <main id="main" className="marketing-page">
        <Hero />
        <Gallery />
        <section id="how-it-works" className="section how-section">
          <div className="section-heading">
            <h2>From a blank page to a published website.</h2>
            <p>Work in the visual editor. See your changes as you make them.</p>
          </div>
          <div className="steps">
            <article>
              <SquaresFourIcon />
              <h3>Add the pieces you need.</h3>
              <p>
                Start with text, images and buttons. Premium adds a library of navigation,
                galleries, layouts and interactive components.
              </p>
            </article>
            <article>
              <SlidersHorizontalIcon />
              <h3>Arrange it your way.</h3>
              <p>
                Move blocks into place, edit their content and check the mobile view. With Premium,
                choose backgrounds, patterns and styles.
              </p>
            </article>
            <article>
              <GlobeSimpleIcon />
              <h3>Preview, then publish.</h3>
              <p>
                Keep working in a private draft. Publish to your Ownspace address when you are
                ready, and update it whenever you need.
              </p>
            </article>
          </div>
          <Link className="text-link" href="/editor">
            Open the editor <ArrowUpRightIcon />
          </Link>
        </section>
        <section className="section ownership-section">
          <div className="ownership-copy">
            <h2>Your draft stays private until you publish.</h2>
            <div>
              <p>
                Preview your website before sharing it. Take it offline when you need to. Export
                your content, or your React source with Premium.
              </p>
              <Link className="text-link" href="/privacy">
                Your privacy, explained <ArrowUpRightIcon />
              </Link>
            </div>
          </div>
        </section>
        <Pricing />
        <section className="section final-cta">
          <div>
            <h2>Start with a blank page.</h2>
            <p>Add your first block in the editor.</p>
          </div>
          <Link className="button" href="/editor">
            Build your website <ArrowUpRightIcon />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
