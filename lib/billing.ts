import { createHash } from "node:crypto";
import Stripe from "stripe";
import { ApiError } from "./http";
import { getSiteUrl, siteConfig } from "./config";
import type { Repository } from "./repository";
export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY)
    throw new ApiError("Purchases are currently unavailable.", 503);
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-09-30.endive",
    timeout: 15000,
    maxNetworkRetries: 1,
  });
}
export function billingEnabled() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PREMIUM_PRICE_ID &&
    process.env.STRIPE_WEBHOOK_SECRET,
  );
}
export function assertPremiumPrice(price: Stripe.Price) {
  if (
    !price.active ||
    price.type !== "one_time" ||
    !Number.isSafeInteger(siteConfig.priceAmount) ||
    siteConfig.priceAmount <= 0 ||
    price.unit_amount !== siteConfig.priceAmount ||
    price.currency !== siteConfig.currency.toLowerCase()
  )
    throw new ApiError("Purchases are temporarily unavailable while pricing is updated.", 503);
}
export function checkoutPaymentState(session: Stripe.Checkout.Session) {
  const payment = typeof session.payment_intent === "object" ? session.payment_intent : null;
  if (session.status === "expired") return "expired";
  if (session.status === "open") return "open";
  if (
    session.status === "complete" &&
    (payment?.status === "requires_payment_method" || payment?.status === "canceled")
  )
    return "failed";
  return "pending";
}
export async function openPremiumCheckout(repo: Repository, owner: string, stripe: Stripe) {
  const priceId = process.env.STRIPE_PREMIUM_PRICE_ID!;
  assertPremiumPrice(await stripe.prices.retrieve(priceId));
  const origin = getSiteUrl();
  return repo.checkout(owner, async (attempt) => {
    if (attempt.entitlement === "paid")
      throw new ApiError("Your account already has Premium.", 409);
    if (attempt.entitlement === "disputed")
      throw new ApiError(
        "This purchase has an open payment dispute. Check its status before purchasing again.",
        409,
      );
    if (attempt.sessionId) {
      const previous = await stripe.checkout.sessions.retrieve(attempt.sessionId, {
        expand: ["payment_intent"],
      });
      if (previous.status === "open") {
        if (
          previous.metadata?.price_id === priceId &&
          previous.metadata?.checkout_origin === origin &&
          previous.url
        )
          return { sessionId: previous.id, priceId, value: { url: previous.url } };
        // Expire the old link first; an expiration/payment race fails closed for a retry.
        await stripe.checkout.sessions.expire(previous.id);
      }
      const payment = typeof previous.payment_intent === "object" ? previous.payment_intent : null;
      const failed =
        payment?.status === "requires_payment_method" || payment?.status === "canceled";
      const paymentId =
        typeof previous.payment_intent === "string"
          ? previous.payment_intent
          : previous.payment_intent?.id;
      const revoked = paymentId ? await attempt.isRevoked(paymentId) : false;
      if (previous.status === "complete" && !failed && !revoked)
        throw new ApiError(
          "Your payment is being confirmed. Check payment status before trying again.",
          409,
        );
    }
    // Retries use identical parameters even if Stripe received the request before a network failure.
    const key = createHash("sha256")
      .update(JSON.stringify([attempt.key, attempt.sessionId, priceId, origin]))
      .digest("hex");
    const suffix = Array.from(Buffer.from(key.slice(0, 16), "hex"), (n) =>
      String.fromCharCode(97 + (n % 26)),
    ).join("");
    const metadata = {
      owner,
      purchase_kind: "ownspace-premium",
      price_id: priceId,
      checkout_origin: origin,
    };
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: owner,
        metadata,
        payment_intent_data: { metadata },
        success_url: origin + "/dashboard/billing?purchase=complete",
        cancel_url: origin + "/dashboard/billing?purchase=cancelled",
        integration_identifier: "ownspace-" + suffix,
        billing_address_collection: "auto",
        consent_collection: { terms_of_service: "required" },
      },
      { idempotencyKey: "ownspace-premium-" + key },
    );
    if (!session.url) throw new ApiError("Checkout could not be opened. Please try again.", 503);
    return { sessionId: session.id, priceId, value: { url: session.url } };
  });
}
export async function readStripePayload(request: Request) {
  const limit = 1000000;
  if (Number(request.headers.get("content-length") || 0) > limit)
    throw new ApiError("Payload too large.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError("Missing request body.", 400);
  const parts: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    length += chunk.value.byteLength;
    if (length > limit) {
      await reader.cancel();
      throw new ApiError("Payload too large.", 413);
    }
    parts.push(chunk.value);
  }
  return Buffer.concat(parts, length);
}
