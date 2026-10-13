import { randomBytes } from "node:crypto";
import { getRepository } from "@/lib/db";
import { stripeClient, billingEnabled } from "@/lib/billing";
import { getSiteUrl } from "@/lib/config";
import { ownerId, assertOrigin, apiError, json, ApiError } from "@/lib/http";
export async function POST(req: Request) {
  try {
    assertOrigin(req);
    const owner = await ownerId();
    if (!billingEnabled()) throw new ApiError("Purchases are currently unavailable.", 503);
    const repo = await getRepository();
    const profile = await repo.get(owner);
    if (!profile) throw new ApiError("Save your page before upgrading.");
    if (profile.entitlement === "paid") throw new ApiError("Your account already has Premium.");
    if (!(await repo.rateLimit("checkout:" + owner, 5, 600)))
      throw new ApiError("Please wait before trying again.", 429);
    const metadata = { owner, purchase_kind: "ownspace-premium" };
    const session = await stripeClient().checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: process.env.STRIPE_PREMIUM_PRICE_ID!, quantity: 1 }],
      client_reference_id: owner,
      metadata,
      payment_intent_data: { metadata },
      success_url: getSiteUrl() + "/studio?purchase=complete",
      cancel_url: getSiteUrl() + "/studio?purchase=cancelled",
      integration_identifier: "ownspace-" + randomBytes(8).toString("hex").replace(/[0-9]/g, "a"),
      billing_address_collection: "auto",
      consent_collection: { terms_of_service: "required" },
    });
    return json({ url: session.url });
  } catch (e) {
    return apiError(e);
  }
}
