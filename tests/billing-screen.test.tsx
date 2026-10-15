// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
vi.mock("@clerk/nextjs", () => ({ UserButton: () => null }));
vi.mock("../components/agreement-notice", () => ({
  AgreementNotice: () => <p>Agreement controls</p>,
}));
vi.mock("../lib/config", async (original) => {
  const actual = await original<typeof import("../lib/config")>();
  return {
    ...actual,
    siteConfig: { ...actual.siteConfig, paymentPollAttempts: 2, paymentPollDelayMs: 20 },
  };
});
import { Pricing } from "../components/pricing";
import { Billing } from "../components/billing";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  history.replaceState({}, "", "/");
});
it("takes Premium buyers to billing to review agreement and purchase without a saved page", () => {
  render(<Pricing />);
  expect(screen.getByRole("link", { name: "Unlock Premium" }).getAttribute("href")).toBe(
    "/dashboard/billing",
  );
});
it("never starts a checkout in the unauthenticated demo", () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  render(<Billing demo available />);
  expect(screen.getByRole("link", { name: "Sign in to upgrade" })).toBeTruthy();
  expect(fetchMock).not.toHaveBeenCalled();
});
it("shows paid access and editor navigation without offering another purchase", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => json({ entitlement: "paid", payment: "confirmed" })),
  );
  render(<Billing demo={false} available />);
  expect(await screen.findByText(/Premium is active/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Continue to secure checkout" })).toBeNull();
});
it("polls a delayed return and unlocks only after confirmed account entitlement", async () => {
  history.replaceState({}, "", "/dashboard/billing?purchase=complete");
  let count = 0;
  const fetchMock = vi.fn(async (_url: string) =>
    json(
      ++count === 1
        ? { entitlement: "free", payment: "pending" }
        : { entitlement: "paid", payment: "confirmed" },
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  render(<Billing demo={false} available />);
  expect(await screen.findByText(/Premium is active/)).toBeTruthy();
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(fetchMock.mock.calls.every((call) => String(call[0]) === "/api/billing")).toBe(true);
});
it("bounds pending checks and keeps a manual retry without starting another payment", async () => {
  history.replaceState({}, "", "/dashboard/billing?purchase=complete");
  const fetchMock = vi.fn(async () => json({ entitlement: "free", payment: "pending" }));
  vi.stubGlobal("fetch", fetchMock);
  render(<Billing demo={false} available />);
  const check = await screen.findByRole("button", { name: "Check payment status" });
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(
    (screen.getByRole("button", { name: "Continue to secure checkout" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  fireEvent.click(check);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
});
it("lets a failed delayed payment be retried", async () => {
  history.replaceState({}, "", "/dashboard/billing?purchase=complete");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => json({ entitlement: "free", payment: "failed" })),
  );
  render(<Billing demo={false} available />);
  expect(await screen.findByText(/payment did not complete/)).toBeTruthy();
  expect(
    (screen.getByRole("button", { name: "Continue to secure checkout" }) as HTMLButtonElement)
      .disabled,
  ).toBe(false);
});
it("preserves cancellation feedback and surfaces checkout configuration errors", async () => {
  history.replaceState({}, "", "/dashboard/billing?purchase=cancelled");
  const fetchMock = vi.fn(async (url: string) =>
    url === "/api/checkout"
      ? json({ error: "Purchases are currently unavailable." }, 503)
      : json({ entitlement: "free", payment: "open" }),
  );
  vi.stubGlobal("fetch", fetchMock);
  render(<Billing demo={false} available />);
  const buy = await screen.findByRole("button", { name: "Continue to secure checkout" });
  await waitFor(() => expect((buy as HTMLButtonElement).disabled).toBe(false));
  expect(screen.getByText(/Checkout cancelled/)).toBeTruthy();
  fireEvent.click(buy);
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Purchases are currently unavailable.",
  );
  expect((buy as HTMLButtonElement).disabled).toBe(false);
});
it("makes an initial status error retryable without enabling purchases on an unknown plan", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => json({ error: "Status unavailable." }, 503)),
  );
  render(<Billing demo={false} available />);
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Status unavailable.");
  expect(
    (screen.getByRole("button", { name: "Continue to secure checkout" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(
    (screen.getByRole("button", { name: "Check payment status" }) as HTMLButtonElement).disabled,
  ).toBe(false);
});
