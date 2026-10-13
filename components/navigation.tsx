"use client";
import Link from "next/link";
import { useState } from "react";
import { ListIcon, XIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { Logo } from "./logo";
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
      </nav>
      <div className="nav-actions">
        <Link className="quiet-link" href="/sign-in">
          Sign in
        </Link>
        <Link className="button small" href="/studio">
          Make your space <ArrowUpRightIcon />
        </Link>
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
