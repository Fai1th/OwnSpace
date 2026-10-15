import { getRepository } from "@/lib/db";
import { billingEnabled, stripeClient, checkoutPaymentState } from "@/lib/billing";
import { ownerId, apiError, json, ApiError } from "@/lib/http";
export const runtime = "nodejs";
export async function GET() {
  try {
    const owner = await ownerId();
    const repo = await getRepository();
    const entitlement = await repo.entitlement(owner);
    if (entitlement === "paid") return json({ entitlement, payment: "confirmed" });
    const sessionId = await repo.checkoutSession(owner);
    let payment = "none";
    if (sessionId && billingEnabled()) {
      if (!(await repo.rateLimit("billing-status:" + owner, 30, 60)))
        throw new ApiError("Please wait a moment before checking payment status again.", 429);
      const session = await stripeClient().checkout.sessions.retrieve(sessionId, {
        expand: ["payment_intent"],
      });
      const paymentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      payment =
        paymentId && (await repo.revokedPayment(owner, paymentId))
          ? "revoked"
          : checkoutPaymentState(session);
    }
    return json({ entitlement, payment });
  } catch (error) {
    return apiError(error);
  }
}
