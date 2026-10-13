import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { cleanup } from "@/lib/account-cleanup";
import { apiError, json, ApiError } from "@/lib/http";
export async function POST(req: NextRequest) {
  try {
    if (!process.env.CLERK_WEBHOOK_SIGNING_SECRET) throw new ApiError("Webhook unavailable.", 503);
    let event;
    try {
      event = await verifyWebhook(req);
    } catch {
      throw new ApiError("Invalid signature.", 400);
    }
    if (event.type === "user.deleted" && event.data.id) await cleanup(event.data.id, true);
    return json({ received: true });
  } catch (e) {
    return apiError(e);
  }
}
