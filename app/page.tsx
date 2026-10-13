import Link from "next/link";
import {
  ArrowUpRightIcon,
  LinkSimpleIcon,
  SlidersHorizontalIcon,
  DeviceMobileIcon,
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
      <main id="main">
        <Hero />
        <Gallery />
        <section id="how-it-works" className="section how-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">FROM EMPTY TAB TO YOUR OWN PLACE</div>
              <h2>
                A few minutes.
                <br />A space that stays yours.
              </h2>
            </div>
            <Link className="text-link" href="/studio">
              Try the editor <ArrowUpRightIcon />
            </Link>
          </div>
          <div className="steps">
            <article>
              <span className="step-number">01</span>
              <SlidersHorizontalIcon />
              <h3>Find your look.</h3>
              <p>
                Start with a style. Change the colors, images and little details until it feels
                right.
              </p>
            </article>
            <article>
              <span className="step-number">02</span>
              <LinkSimpleIcon />
              <h3>Put your world in it.</h3>
              <p>
                Your socials, a project, a playlist. Give everything you want to share a place to
                live.
              </p>
            </article>
            <article>
              <span className="step-number">03</span>
              <DeviceMobileIcon />
              <h3>Take it everywhere.</h3>
              <p>
                Publish when you’re ready. One address for your bio, your friends, or your next
                introduction.
              </p>
            </article>
          </div>
        </section>
        <section className="section ownership-section">
          <span className="eyebrow">PERSONAL DOESN’T HAVE TO MEAN PUBLIC</span>
          <div className="ownership-copy">
            <h2>
              Share what you want.
              <br />
              Keep the rest yours.
            </h2>
            <div>
              <p>
                Your draft stays private until you publish. Change your mind? Take your page offline
                in a click. Export your content whenever you like.
              </p>
              <Link className="text-link" href="/privacy">
                Your privacy, explained <ArrowUpRightIcon />
              </Link>
            </div>
          </div>
        </section>
        <Pricing />
        <section className="section final-cta">
          <div className="eyebrow">THE NEXT LINK IN YOUR BIO</div>
          <h2>
            Leave a little
            <br />
            <span>of yourself here.</span>
          </h2>
          <Link className="button" href="/studio">
            Make your space <ArrowUpRightIcon />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
