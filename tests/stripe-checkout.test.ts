import { beforeAll, afterAll, beforeEach, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { PGlite } from "@electric-sql/pglite";
import { Repository, schemaSql } from "../lib/repository";
import { LEGAL_VERSION } from "../lib/legal-content";
const state = vi.hoisted(() => ({
  owner: "buyer",
  repo: null as unknown as Repository,
  sessions: new Map<string, Record<string, unknown>>(),
  create: vi.fn(),
  retrieve: vi.fn(),
  expire: vi.fn(),
  price: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: state.owner || null }) }));
vi.mock("../lib/config", async (original) => {
  const actual = await original<typeof import("../lib/config")>();
  return {
    ...actual,
    siteConfig: { ...actual.siteConfig, authEnabled: true },
    getSiteUrl: () => "http://localhost:3000",
  };
});
vi.mock("../lib/db", () => ({ getRepository: async () => state.repo }));
vi.mock("../lib/billing", async (original) => {
  const actual = await original<typeof import("../lib/billing")>();
  return {
    ...actual,
    stripeClient: () => ({
      prices: { retrieve: state.price },
      checkout: {
        sessions: { create: state.create, retrieve: state.retrieve, expire: state.expire },
      },
    }),
  };
});
import { POST } from "../app/api/checkout/route";
import { GET as billingStatus } from "../app/api/billing/route";
let db: PGlite;
beforeAll(async () => {
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_fixture");
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fixture");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_fixture");
  vi.stubEnv("STRIPE_PREMIUM_PRICE_ID", "price_premium");
  db = new PGlite();
  await db.exec(schemaSql);
  state.repo = new Repository({
    query: async (sql, params) => db.query(sql, params),
    transaction: async (fn) =>
      db.transaction(async (tx) => fn({ query: async (sql, params) => tx.query(sql, params) })),
  });
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await db.close();
});
beforeEach(async () => {
  state.owner = "buyer";
  await db.exec(
    "TRUNCATE profiles,purchases,billing_events,user_agreements,rate_limits,checkout_attempts,checkout_sessions",
  );
  await state.repo.acceptAgreement("buyer", LEGAL_VERSION);
  state.price
    .mockReset()
    .mockResolvedValue({ active: true, type: "one_time", unit_amount: 1200, currency: "usd" });
  state.sessions.clear();
  process.env.STRIPE_PREMIUM_PRICE_ID = "price_premium";
  state.expire.mockReset().mockImplementation(async (id: string) => {
    state.sessions.get(id)!.status = "expired";
    return state.sessions.get(id);
  });
  state.create
    .mockReset()
    .mockImplementation(async (params: Stripe.Checkout.SessionCreateParams) => {
      const id = "cs_fixture_" + (state.sessions.size + 1);
      const session = {
        id,
        url: "https://checkout.stripe.com/" + id,
        status: "open",
        payment_status: "unpaid",
        metadata: params.metadata,
      };
      state.sessions.set(id, session);
      return session;
    });
  state.retrieve.mockReset().mockImplementation(async (id: string) => state.sessions.get(id));
});
const request = (origin = "http://localhost:3000") =>
  new Request("http://localhost:3000/api/checkout", {
    method: "POST",
    headers: { origin },
    body: JSON.stringify({ owner: "victim", price: "price_fake" }),
  });
it("allows upgrading before a page exists and uses only the authenticated owner and configured price", async () => {
  const response = await POST(request());
  expect(response.status).toBe(200);
  const params = state.create.mock.calls[0][0];
  expect(params.mode).toBe("payment");
  expect(params.line_items).toEqual([{ price: "price_premium", quantity: 1 }]);
  expect(params.client_reference_id).toBe("buyer");
  expect(params.metadata.owner).toBe("buyer");
  expect(params.success_url).toBe("http://localhost:3000/dashboard/billing?purchase=complete");
  expect(params.cancel_url).toBe("http://localhost:3000/dashboard/billing?purchase=cancelled");
  expect(params.integration_identifier).toMatch(/^ownspace-[a-z]{8}$/);
  expect(params.payment_method_types).toBeUndefined();
  expect(state.create.mock.calls[0][1].idempotencyKey).toBeTruthy();
});
it("reuses an open checkout across requests instead of opening another payment", async () => {
  expect((await POST(request())).status).toBe(200);
  const first = await (await POST(request())).json();
  expect(state.create).toHaveBeenCalledTimes(1);
  expect(first.url).toBe("https://checkout.stripe.com/cs_fixture_1");
});
it("retries an ambiguous network failure with the same Stripe idempotency key", async () => {
  state.owner = "network-buyer";
  await state.repo.acceptAgreement(state.owner, LEGAL_VERSION);
  state.create.mockRejectedValueOnce(new Error("network"));
  expect((await POST(request())).status).toBe(500);
  expect((await POST(request())).status).toBe(200);
  expect(state.create.mock.calls[0][1].idempotencyKey).toBe(
    state.create.mock.calls[1][1].idempotencyKey,
  );
  expect(state.create.mock.calls[0][0]).toEqual(state.create.mock.calls[1][0]);
});
it("starts a fresh checkout after an expired session", async () => {
  state.owner = "expired-buyer";
  await state.repo.acceptAgreement(state.owner, LEGAL_VERSION);
  await POST(request());
  state.sessions.get("cs_fixture_1")!.status = "expired";
  expect((await POST(request())).status).toBe(200);
  expect(state.create).toHaveBeenCalledTimes(2);
  expect(state.create.mock.calls[0][1].idempotencyKey).not.toBe(
    state.create.mock.calls[1][1].idempotencyKey,
  );
});
it("blocks already paid accounts even without a saved profile", async () => {
  await state.repo.billing({
    eventId: "paid",
    owner: "buyer",
    paymentId: "pi_buyer",
    status: "paid",
  });
  expect((await POST(request())).status).toBe(409);
  expect(state.create).not.toHaveBeenCalled();
});
it("blocks another checkout when a completed payment is awaiting its webhook", async () => {
  state.owner = "pending-buyer";
  await state.repo.acceptAgreement(state.owner, LEGAL_VERSION);
  await POST(request());
  Object.assign(state.sessions.get("cs_fixture_1")!, {
    status: "complete",
    payment_status: "paid",
  });
  expect((await POST(request())).status).toBe(409);
  expect(state.create).toHaveBeenCalledTimes(1);
});
it.each([{ active: false }, { type: "recurring" }, { unit_amount: 100 }, { currency: "eur" }])(
  "fails closed for a mismatched Stripe price: %j",
  async (override) => {
    state.price.mockResolvedValue({
      active: true,
      type: "one_time",
      unit_amount: 1200,
      currency: "usd",
      ...override,
    });
    expect((await POST(request())).status).toBe(503);
    expect(state.create).not.toHaveBeenCalled();
  },
);
it("expires an obsolete open price before creating a replacement checkout", async () => {
  await POST(request());
  process.env.STRIPE_PREMIUM_PRICE_ID = "price_changed";
  expect((await POST(request())).status).toBe(200);
  expect(state.expire).toHaveBeenCalledWith("cs_fixture_1");
  expect(state.create).toHaveBeenCalledTimes(2);
  expect(state.create.mock.calls[1][0].line_items).toEqual([
    { price: "price_changed", quantity: 1 },
  ]);
});
it("serializes simultaneous attempts into one payable session", async () => {
  state.owner = "concurrent-buyer";
  await state.repo.acceptAgreement(state.owner, LEGAL_VERSION);
  const responses = await Promise.all([POST(request()), POST(request())]);
  expect(responses.map((r) => r.status)).toEqual([200, 200]);
  expect(state.create).toHaveBeenCalledTimes(1);
});
it("allows a repurchase after a refund but blocks another payment while that repurchase is confirming", async () => {
  state.owner = "refunded-buyer";
  await state.repo.acceptAgreement(state.owner, LEGAL_VERSION);
  await POST(request());
  Object.assign(state.sessions.get("cs_fixture_1")!, {
    status: "complete",
    payment_status: "paid",
    payment_intent: "pi_old",
  });
  await state.repo.billing({
    eventId: "refund-old",
    owner: state.owner,
    paymentId: "pi_old",
    status: "refunded",
  });
  expect(await (await billingStatus()).json()).toEqual({
    entitlement: "refunded",
    payment: "revoked",
  });
  expect((await POST(request())).status).toBe(200);
  Object.assign(state.sessions.get("cs_fixture_2")!, {
    status: "complete",
    payment_status: "paid",
    payment_intent: "pi_new",
  });
  expect(await (await billingStatus()).json()).toEqual({
    entitlement: "refunded",
    payment: "pending",
  });
  expect((await POST(request())).status).toBe(409);
  expect(state.create).toHaveBeenCalledTimes(2);
});
it("reports delayed failures without granting access and lets buyers retry", async () => {
  state.owner = "failed-buyer";
  await state.repo.acceptAgreement(state.owner, LEGAL_VERSION);
  await POST(request());
  Object.assign(state.sessions.get("cs_fixture_1")!, {
    status: "complete",
    payment_status: "unpaid",
    payment_intent: { id: "pi_failed", status: "requires_payment_method" },
  });
  expect(await (await billingStatus()).json()).toEqual({ entitlement: "free", payment: "failed" });
  expect((await POST(request())).status).toBe(200);
});
it("keeps billing status private to the signed-in account and never grants paid access from a paid session alone", async () => {
  await POST(request());
  Object.assign(state.sessions.get("cs_fixture_1")!, {
    status: "complete",
    payment_status: "paid",
    payment_intent: "pi_buyer",
  });
  const response = await billingStatus();
  expect(await response.json()).toEqual({ entitlement: "free", payment: "pending" });
  expect(response.headers.get("cache-control")).toContain("no-store");
  state.owner = "other-buyer";
  expect(await (await billingStatus()).json()).toEqual({ entitlement: "free", payment: "none" });
  state.owner = "";
  expect((await billingStatus()).status).toBe(401);
});
it("returns confirmed entitlement without contacting Stripe again", async () => {
  await state.repo.billing({
    eventId: "confirmed",
    owner: state.owner,
    paymentId: "pi_confirmed",
    status: "paid",
  });
  expect(await (await billingStatus()).json()).toEqual({
    entitlement: "paid",
    payment: "confirmed",
  });
  expect(state.retrieve).not.toHaveBeenCalled();
});
it("rejects signed-out, cross-origin and unaccepted-agreement attempts", async () => {
  state.owner = "";
  expect((await POST(request())).status).toBe(401);
  state.owner = "buyer";
  expect((await POST(request("https://other.example"))).status).toBe(403);
  state.owner = "no-agreement";
  expect((await POST(request())).status).toBe(428);
  expect(state.create).not.toHaveBeenCalled();
});
