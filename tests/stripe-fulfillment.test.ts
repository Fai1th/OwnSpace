import { beforeAll, afterAll, beforeEach, expect, it, vi } from "vitest";
import Stripe from "stripe";
import { PGlite } from "@electric-sql/pglite";
import { Repository, schemaSql } from "../lib/repository";
const state = vi.hoisted(() => ({ repo: null as unknown as Repository, items: vi.fn() }));
vi.mock("../lib/db", () => ({ getRepository: async () => state.repo }));
vi.mock("../lib/billing", async (original) => {
  const actual = await original<typeof import("../lib/billing")>();
  return {
    ...actual,
    stripeClient: () => ({
      webhooks: new Stripe("sk_test_fixture").webhooks,
      checkout: { sessions: { listLineItems: state.items } },
    }),
  };
});
import { POST } from "../app/api/webhooks/stripe/route";
let db: PGlite;
const secret = "whsec_fixture";
beforeAll(async () => {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fixture");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", secret);
  vi.stubEnv("STRIPE_PREMIUM_PRICE_ID", "price_fixture");
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
  await db.exec("TRUNCATE profiles,purchases,billing_events,checkout_sessions");
  state.items.mockReset().mockResolvedValue({
    data: [{ price: { id: "price_fixture" }, quantity: 1 }],
    has_more: false,
  });
});
const session = {
  id: "cs_fixture",
  mode: "payment",
  payment_status: "paid",
  payment_intent: "pi_fixture",
  client_reference_id: "buyer",
  metadata: { owner: "buyer", purchase_kind: "ownspace-premium" },
};
async function send(
  object: unknown = session,
  type = "checkout.session.completed",
  id = "evt_fixture",
) {
  const payload = JSON.stringify({ id, object: "event", type, data: { object } });
  const signature = new Stripe("sk_test_fixture").webhooks.generateTestHeaderString({
    payload,
    secret,
  });
  return POST(
    new Request("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": signature },
      body: payload,
    }),
  );
}
it("grants an account without a page exactly once from signed paid events", async () => {
  expect((await send()).status).toBe(200);
  expect((await send()).status).toBe(200);
  expect(await state.repo.entitlement("buyer")).toBe("paid");
  expect((await db.query("SELECT * FROM purchases")).rows).toHaveLength(1);
});
it("waits for delayed payment success before granting access", async () => {
  await send({ ...session, payment_status: "unpaid" });
  expect(await state.repo.entitlement("buyer")).toBe("free");
  expect(
    (await send(session, "checkout.session.async_payment_succeeded", "evt_async")).status,
  ).toBe(200);
  expect(await state.repo.entitlement("buyer")).toBe("paid");
});
it("does not grant unpaid, subscription or unrelated sessions", async () => {
  for (const value of [{ payment_status: "unpaid" }, { mode: "subscription" }, { metadata: {} }])
    await send({ ...session, ...value });
  expect(await state.repo.entitlement("buyer")).toBe("free");
});
it("rejects conflicting owner metadata and client reference", async () => {
  expect((await send({ ...session, client_reference_id: "someone-else" })).status).toBe(400);
  expect(await state.repo.entitlement("buyer")).toBe("free");
});
it("retries a malformed paid event missing a payment reference instead of acknowledging fulfillment", async () => {
  expect((await send({ ...session, payment_intent: null })).status).toBe(400);
  expect(await state.repo.entitlement("buyer")).toBe("free");
});
it("rejects wrong prices, extra items, quantities and truncated line item lists", async () => {
  for (const items of [
    { data: [{ price: { id: "price_other" }, quantity: 1 }] },
    { data: [{ price: { id: "price_fixture" }, quantity: 2 }] },
    { data: [{ price: { id: "price_fixture" }, quantity: 1 }], has_more: true },
  ]) {
    state.items.mockResolvedValue(items);
    expect((await send()).status).toBe(400);
  }
  expect(await state.repo.entitlement("buyer")).toBe("free");
});
it("fulfills a historical approved price after the configured Price has changed", async () => {
  await db.query("INSERT INTO checkout_sessions(session_id,owner,price_id) VALUES($1,$2,$3)", [
    "cs_fixture",
    "buyer",
    "price_previous",
  ]);
  state.items.mockResolvedValue({ data: [{ price: { id: "price_previous" }, quantity: 1 }] });
  expect((await send()).status).toBe(200);
  expect(await state.repo.entitlement("buyer")).toBe("paid");
});
it("does not trust an arbitrary retired price from session metadata", async () => {
  state.items.mockResolvedValue({ data: [{ price: { id: "price_unapproved" }, quantity: 1 }] });
  expect(
    (
      await send({
        ...session,
        id: "cs_unapproved",
        metadata: { ...session.metadata, price_id: "price_unapproved" },
      })
    ).status,
  ).toBe(400);
  expect(await state.repo.entitlement("buyer")).toBe("free");
});
it("does not resurrect the owner association after account deletion", async () => {
  await db.query("INSERT INTO checkout_sessions(session_id,owner,price_id) VALUES($1,$2,$3)", [
    "cs_deleted",
    "buyer",
    "price_fixture",
  ]);
  await state.repo.delete("buyer", true);
  expect((await send({ ...session, id: "cs_deleted" })).status).toBe(200);
  expect(await state.repo.entitlement("buyer")).toBe("free");
});
it("checks session deletion again inside the billing transaction", async () => {
  await db.query("INSERT INTO checkout_sessions(session_id,owner,price_id) VALUES($1,$2,$3)", [
    "cs_deleted_race",
    "buyer",
    "price_fixture",
  ]);
  await state.repo.delete("buyer", true);
  await state.repo.billing({
    eventId: "evt_deletion_race",
    owner: "buyer",
    paymentId: "pi_deletion_race",
    sessionId: "cs_deleted_race",
    status: "paid",
  });
  expect(await state.repo.entitlement("buyer")).toBe("free");
});
it("keeps partial refunds active and revokes full refunds", async () => {
  await send();
  await send({ payment_intent: "pi_fixture", refunded: false }, "charge.refunded", "evt_partial");
  expect(await state.repo.entitlement("buyer")).toBe("paid");
  await send({ payment_intent: "pi_fixture", refunded: true }, "charge.refunded", "evt_full");
  expect(await state.repo.entitlement("buyer")).toBe("refunded");
});
it("rejects oversized streamed bodies before reading the rest", async () => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(1000001));
      controller.enqueue(new Uint8Array(1));
      controller.close();
    },
    cancel() {
      cancelled = true;
    },
  });
  const response = await POST(
    new Request("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "fixture" },
      body,
      duplex: "half",
    } as RequestInit),
  );
  expect(response.status).toBe(413);
  expect(cancelled).toBe(true);
});
