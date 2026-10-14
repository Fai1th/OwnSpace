"use client";
import Link from "next/link";
import { useState } from "react";
import { ListIcon, XIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { Logo } from "./logo";
import { AuthControls, MobileSignIn } from "./auth-controls";
import { siteConfig } from "@/lib/config";
export function Navigation() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-nav">
      <Logo />
      <nav aria-label="Main navigation" className={open ? "nav-links open" : "nav-links"}>
        <Link href="/#explore" onClick={() => setOpen(false)}>
          Explore
        </Link>
        <Link href="/#how-it-works" onClick={() => setOpen(false)}>
          How it works
        </Link>
        <Link href="/pricing" onClick={() => setOpen(false)}>
          Pricing
        </Link>
        {open &&
          (siteConfig.authEnabled ? (
            <MobileSignIn onNavigate={() => setOpen(false)} />
          ) : (
            <Link className="mobile-account-link" href="/sign-in" onClick={() => setOpen(false)}>
              Sign in
            </Link>
          ))}
      </nav>
      <div className="nav-actions">
        {siteConfig.authEnabled ? (
          <AuthControls />
        ) : (
          <>
            <Link className="quiet-link" href="/sign-in">
              Sign in
            </Link>
            <Link className="button small" href="/editor">
              Build your website <ArrowUpRightIcon />
            </Link>
          </>
        )}
        <button
          className="icon-button mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <XIcon /> : <ListIcon />}
        </button>
      </div>
    </header>
  );
}
