import { NextResponse } from "next/server";
export async function GET() {
  const configured = Boolean(
    process.env.DATABASE_URL &&
    process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_LEGAL_OPERATOR &&
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
  );
  return NextResponse.json(
    { status: configured ? "configured" : "preview" },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
