"use client";
import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
export function AuthControls() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded)
    return (
      <span className="quiet-link" role="status">
        Loading account…
      </span>
    );
  return isSignedIn ? (
    <>
      <Link className="button small" href="/studio">
        Dashboard <ArrowUpRightIcon />
      </Link>
      <UserButton />
    </>
  ) : (
    <>
      <Link className="quiet-link" href="/sign-in">
        Sign in
      </Link>
      <Link className="button small" href="/sign-up">
        Create your space <ArrowUpRightIcon />
      </Link>
    </>
  );
}
