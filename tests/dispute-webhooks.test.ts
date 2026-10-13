import { beforeAll, afterAll, it, expect, vi } from "vitest";
import Stripe from "stripe";
import { PGlite } from "@electric-sql/pglite";
import { Repository, schemaSql } from "../lib/repository";
import { emptyProfile } from "../lib/profile";
const state = vi.hoisted(() => ({ repo: null as unknown as Repository }));
vi.mock("../lib/db", () => ({ getRepository: async () => state.repo }));
import { POST } from "../app/api/webhooks/stripe/route";
const secret = "whsec_local_fixture";
const stripe = new Stripe("sk_test_local_fixture");
let db: PGlite;
const original = {
  key: process.env.STRIPE_SECRET_KEY,
  secret: process.env.STRIPE_WEBHOOK_SECRET,
  price: process.env.STRIPE_PREMIUM_PRICE_ID,
};
beforeAll(async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_local_fixture";
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  process.env.STRIPE_PREMIUM_PRICE_ID = "price_local_fixture";
  db = new PGlite();
  await db.exec(schemaSql);
  state.repo = new Repository({
    query: async (s, p) => db.query(s, p),
    transaction: async (fn) =>
      db.transaction(async (tx) => fn({ query: async (s, p) => tx.query(s, p) })),
  });
});
afterAll(async () => {
  for (const [key, value] of [
    ["STRIPE_SECRET_KEY", original.key],
    ["STRIPE_WEBHOOK_SECRET", original.secret],
    ["STRIPE_PREMIUM_PRICE_ID", original.price],
  ] as const) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  await db.close();
});
async function event(id: string, type: string, payment: string, status: string) {
  const payload = JSON.stringify({
    id,
    object: "event",
    type,
    created: Math.floor(Date.now() / 1000),
    data: { object: { id: "du_" + payment, object: "dispute", payment_intent: payment, status } },
  });
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
  return POST(
    new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": signature },
      body: payload,
    }),
  );
}
async function buyer(owner: string) {
  await state.repo.save(owner, { ...emptyProfile, handle: owner }, 0);
  await state.repo.billing({
    eventId: "paid_" + owner,
    owner,
    paymentId: "pi_" + owner,
    status: "paid",
  });
}
it("restores Premium after a won dispute rather than treating it as a permanent refund", async () => {
  await buyer("winner");
  expect(
    (await event("open_win", "charge.dispute.created", "pi_winner", "needs_response")).status,
  ).toBe(200);
  expect((await state.repo.get("winner"))?.entitlement).toBe("disputed");
  expect((await event("close_win", "charge.dispute.closed", "pi_winner", "won")).status).toBe(200);
  expect((await state.repo.get("winner"))?.entitlement).toBe("paid");
});
it("does not undo a settled win when the opening event arrives late", async () => {
  await buyer("reordered");
  await event("close_early", "charge.dispute.closed", "pi_reordered", "won");
  await event("open_late", "charge.dispute.created", "pi_reordered", "needs_response");
  expect((await state.repo.get("reordered"))?.entitlement).toBe("paid");
});
it("does not let delayed checkout completion reopen a pending dispute", async () => {
  await buyer("pending-buyer");
  await event("open_pending", "charge.dispute.created", "pi_pending-buyer", "needs_response");
  await state.repo.billing({
    eventId: "late_complete",
    owner: "pending-buyer",
    paymentId: "pi_pending-buyer",
    status: "paid",
  });
  expect((await state.repo.get("pending-buyer"))?.entitlement).toBe("disputed");
});
it("keeps a fully refunded purchase revoked even if a won closure arrives later", async () => {
  await buyer("refunded");
  await state.repo.billing({
    eventId: "real_refund",
    paymentId: "pi_refunded",
    status: "refunded",
  });
  await event("win_after_refund", "charge.dispute.closed", "pi_refunded", "won");
  expect((await state.repo.get("refunded"))?.entitlement).toBe("refunded");
});
it("rejects a forged payment event before accessing purchases", async () => {
  const response = await POST(
    new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "forged" },
      body: "{}",
    }),
  );
  expect(response.status).toBe(400);
});
