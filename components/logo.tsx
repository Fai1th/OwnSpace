import Link from "next/link";
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="Ownspace home">
      {compact ? (
        <svg
          width="34"
          height="34"
          viewBox="270 320 710 700"
          aria-hidden="true"
          style={{ overflow: "hidden" }}
        >
          <image href="/brand/mark-transparent.png" width="1254" height="1254" />
        </svg>
      ) : (
        <svg
          className="brand-wordmark"
          width="188"
          height="39"
          viewBox="100 305 1480 315"
          aria-hidden="true"
          style={{ overflow: "hidden", maxWidth: "100%" }}
        >
          <image href="/brand/logo-transparent.png" width="1672" height="941" />
        </svg>
      )}
    </Link>
  );
}
