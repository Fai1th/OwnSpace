"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="error-page">
      <span className="eyebrow">SOMETHING WENT WRONG</span>
      <h1>Let’s try that again.</h1>
      <p>We couldn’t load this space. Your saved data hasn’t been changed.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
      <Link className="text-link" href="/">
        Back to Ownspace
      </Link>
    </main>
  );
}
