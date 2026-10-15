import { requireSiteAgreement } from "@/lib/agreements";
import { getRepository } from "@/lib/db";
import { openPremiumCheckout, billingEnabled, stripeClient } from "@/lib/billing";
import { ownerId, assertOrigin, apiError, json, ApiError } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    assertOrigin(req);
    const owner = await ownerId();
    if (!billingEnabled()) throw new ApiError("Purchases are currently unavailable.", 503);
    const repo = await getRepository();
    if ((await repo.entitlement(owner)) === "paid")
      throw new ApiError("Your account already has Premium.", 409);
    await requireSiteAgreement(owner);
    if (!(await repo.rateLimit("checkout:" + owner, 5, 600)))
      throw new ApiError("Please wait before trying again.", 429);
    return json(await openPremiumCheckout(repo, owner, stripeClient()));
  } catch (e) {
    return apiError(e);
  }
}
