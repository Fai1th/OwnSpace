import type Stripe from "stripe";
import { getRepository } from "@/lib/db";
import { readStripePayload, stripeClient } from "@/lib/billing";
import { apiError, json, ApiError } from "@/lib/http";
export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_PREMIUM_PRICE_ID)
      throw new ApiError("Webhook is not configured.", 503);
    if (Number(req.headers.get("content-length") || 0) > 1000000)
      throw new ApiError("Payload too large.", 413);
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new ApiError("Missing signature.", 400);
    const raw = await readStripePayload(req);
    const stripe = stripeClient();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(raw, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch {
      throw new ApiError("Invalid signature.", 400);
    }
    const repo = await getRepository();
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      if (
        session.payment_status === "paid" &&
        session.mode === "payment" &&
        session.metadata?.purchase_kind === "ownspace-premium" &&
        session.metadata.owner
      ) {
        if (session.client_reference_id !== session.metadata.owner)
          throw new ApiError("Unexpected purchase owner.", 400);
        const approved = await repo.approvedCheckout(session.id);
        if (approved?.owner === "deleted") return json({ received: true });
        if (approved && approved.owner !== session.metadata.owner)
          throw new ApiError("Unexpected purchase owner.", 400);
        const expectedPrice = approved?.priceId || process.env.STRIPE_PREMIUM_PRICE_ID;
        const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
        if (
          items.has_more ||
          items.data.length !== 1 ||
          items.data[0].price?.id !== expectedPrice ||
          items.data[0].quantity !== 1
        )
          throw new ApiError("Unexpected purchase.", 400);
        const pi =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;
        if (!pi) throw new ApiError("Missing payment reference.", 400);
        await repo.billing({
          eventId: event.id,
          sessionId: session.id,
          owner: session.metadata.owner,
          paymentId: pi,
          status: "paid",
        });
      }
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      if (charge.refunded) {
        const pi =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (pi) await repo.billing({ eventId: event.id, paymentId: pi, status: "refunded" });
      }
    } else if (event.type === "charge.dispute.created" || event.type === "charge.dispute.closed") {
      const dispute = event.data.object as Stripe.Dispute;
      const pi =
        typeof dispute.payment_intent === "string"
          ? dispute.payment_intent
          : dispute.payment_intent?.id;
      if (pi) {
        const status =
          event.type === "charge.dispute.created"
            ? "disputed"
            : dispute.status === "won" || dispute.status === "warning_closed"
              ? "dispute_won"
              : dispute.status === "lost"
                ? "dispute_lost"
                : null;
        if (status) await repo.billing({ eventId: event.id, paymentId: pi, status });
      }
    }
    return json({ received: true });
  } catch (e) {
    return apiError(e);
  }
}
