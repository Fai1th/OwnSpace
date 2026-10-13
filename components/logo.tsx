import Link from "next/link";
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="Ownspace home">
      <svg width="34" height="30" viewBox="0 0 44 36" aria-hidden="true">
        <g fill="currentColor" transform="skewX(-35)">
          <rect x="17" y="2" width="16" height="23" rx="5" />
          <rect x="39" y="11" width="16" height="23" rx="5" />
        </g>
      </svg>
      {!compact && (
        <span>
          <b>own</b>space
        </span>
      )}
    </Link>
  );
}
