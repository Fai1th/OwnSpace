import Stripe from "stripe";
import { ApiError } from "./http";
export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY)
    throw new ApiError("Purchases are currently unavailable.", 503);
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}
export function billingEnabled() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PREMIUM_PRICE_ID &&
    process.env.STRIPE_WEBHOOK_SECRET,
  );
}
