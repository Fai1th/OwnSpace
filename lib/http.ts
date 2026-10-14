import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { siteConfig, getSiteUrl } from "./config";
import { isLaunchBlocked } from "./deployment";
import { PlanLimitError } from "./plans";
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function assertServiceReady() {
  if (isLaunchBlocked())
    throw new ApiError(
      "Account features are temporarily unavailable while setup is completed.",
      503,
    );
}
export async function ownerId() {
  assertServiceReady();
  if (!siteConfig.authEnabled || !process.env.CLERK_SECRET_KEY)
    throw new ApiError("Sign-in is not configured. You can try the local preview.", 503);
  const { userId } = await auth();
  if (!userId) throw new ApiError("Sign in to continue.", 401);
  return userId;
}
export function assertOrigin(request: Request) {
  assertServiceReady();
  const origin = request.headers.get("origin");
  const expected =
    process.env.NODE_ENV === "production" && process.env.OWNSPACE_LOCAL_PREVIEW !== "1"
      ? getSiteUrl()
      : new URL(request.url).origin;
  if (!origin || origin !== expected) throw new ApiError("This request is not allowed.", 403);
}
export async function readJson(request: Request, limit = 1700000) {
  if (Number(request.headers.get("content-length") || 0) > limit)
    throw new ApiError("This page is too large. Use smaller images.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError("Missing request body.");
  let length = 0;
  const parts: Uint8Array[] = [];
  while (true) {
    const item = await reader.read();
    if (item.done) break;
    length += item.value.length;
    if (length > limit) {
      await reader.cancel();
      throw new ApiError("This page is too large. Use smaller images.", 413);
    }
    parts.push(item.value);
  }
  const out = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(out));
  } catch {
    throw new ApiError("Invalid request body.");
  }
}
export function apiError(error: unknown) {
  if (error instanceof PlanLimitError)
    return NextResponse.json({ error: error.message }, { status: 403 });
  if (error instanceof ApiError)
    return NextResponse.json({ error: error.message }, { status: error.status });
  if (
    error instanceof Error &&
    /already taken|changed in another tab|Save your page/.test(error.message)
  )
    return NextResponse.json({ error: error.message }, { status: 409 });
  console.error("[ownspace] request failed", error instanceof Error ? error.name : "UnknownError");
  return NextResponse.json(
    { error: "We couldn't finish that request. Please try again." },
    { status: 500 },
  );
}
export function json(data: unknown) {
  return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
}
