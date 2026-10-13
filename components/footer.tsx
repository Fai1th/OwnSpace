"use client";
import Link from "next/link";
import { Logo } from "./logo";
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <Logo />
        <p>A little space. All yours.</p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/pricing">Pricing</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/cookies">Cookies</Link>
        <button onClick={() => window.dispatchEvent(new Event("ownspace-cookie-settings"))}>
          Cookie settings
        </button>
        <Link href="/report">Report a page</Link>
      </nav>
      <span className="copyright">© {new Date().getFullYear()} Ownspace</span>
    </footer>
  );
}
