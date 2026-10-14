import { NextResponse } from "next/server";
import { deploymentIssues } from "@/lib/deployment";
export async function GET() {
  return NextResponse.json(
    { status: deploymentIssues(process.env).length === 0 ? "configured" : "setup" },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
