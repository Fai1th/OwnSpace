// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react";
import { emptyProfile, type ProfileRecord } from "../lib/profile";
vi.mock("@clerk/nextjs", () => ({ UserButton: () => null }));
vi.mock("../lib/config", async (original) => {
  const real = await original<typeof import("../lib/config")>();
  return {
    ...real,
    siteConfig: { ...real.siteConfig, paymentPollDelayMs: 50, paymentPollAttempts: 2 },
  };
});
vi.mock("@chakra-ui/react", async (original) => {
  const real = await original<typeof import("@chakra-ui/react")>();
  return {
    ...real,
    ChakraProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Input: React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
      (props, ref) => <input {...props} ref={ref} />,
    ),
    Textarea: React.forwardRef<
      HTMLTextAreaElement,
      React.TextareaHTMLAttributes<HTMLTextAreaElement>
    >((props, ref) => <textarea {...props} ref={ref} />),
  };
});
import { StudioEditor } from "../components/studio-editor";
const record: ProfileRecord = {
  owner: "user_fixture",
  handle: "premium-fixture",
  draft: { ...emptyProfile, handle: "premium-fixture", displayName: "Alice" },
  published: null,
  version: 1,
  entitlement: "free",
  views: 0,
  updatedAt: "2026-10-13",
};
function json(data: unknown) {
  return { ok: true, json: async () => data } as Response;
}
beforeEach(() => {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => data.get(key) || null,
    setItem: (key: string, value: string) => data.set(key, value),
    clear: () => data.clear(),
    removeItem: (key: string) => data.delete(key),
  });
  history.replaceState({}, "", "/studio");
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("shows an existing paid account correctly even when it has no page", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(json({ profile: null, entitlement: "paid" }))),
  );
  render(<StudioEditor demo={false} />);
  expect(await screen.findByText("Premium account")).toBeTruthy();
});
it("updates delayed confirmation without replacing edits or the saved version", async () => {
  history.replaceState({}, "", "/studio?purchase=complete");
  let checks = 0,
    submittedVersion: number | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, options?: RequestInit) => {
      if (url === "/api/account") {
        checks++;
        return Promise.resolve(
          json({
            entitlement: checks >= 2 ? "paid" : "free",
            profile: {
              ...record,
              version: 99,
              draft: { ...record.draft, displayName: "Other tab" },
            },
          }),
        );
      }
      if (options?.method === "PUT") {
        const data = JSON.parse(options.body as string);
        submittedVersion = data.version;
        return Promise.resolve(
          json({ profile: { ...record, version: 2, entitlement: "paid", draft: data.profile } }),
        );
      }
      return Promise.resolve(json({ profile: record, entitlement: "free" }));
    }),
  );
  render(<StudioEditor demo={false} />);
  const name = await screen.findByLabelText("Display name");
  fireEvent.change(name, { target: { value: "My unsaved edit" } });
  await screen.findByText("Premium account");
  expect((screen.getByLabelText("Display name") as HTMLInputElement).value).toBe("My unsaved edit");
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(submittedVersion).toBe(1));
  expect(checks).toBe(2);
});
it("does not let an older save response undo verified payment confirmation", async () => {
  history.replaceState({}, "", "/studio?purchase=complete");
  let checks = 0,
    submitted = record.draft,
    finish!: (response: Response) => void;
  const pending = new Promise<Response>((resolve) => (finish = resolve));
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, options?: RequestInit) => {
      if (url === "/api/account") {
        checks++;
        return Promise.resolve(json({ entitlement: checks >= 2 ? "paid" : "free" }));
      }
      if (options?.method === "PUT") {
        submitted = JSON.parse(options.body as string).profile;
        return pending;
      }
      return Promise.resolve(json({ profile: record, entitlement: "free" }));
    }),
  );
  render(<StudioEditor demo={false} />);
  const name = await screen.findByLabelText("Display name");
  fireEvent.change(name, { target: { value: "My page" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText("Premium account");
  await act(async () =>
    finish(json({ profile: { ...record, version: 2, draft: submitted, entitlement: "free" } })),
  );
  expect(screen.queryByText("Premium account")).not.toBeNull();
});
it("keeps a manual status check after bounded confirmation attempts", async () => {
  history.replaceState({}, "", "/studio?purchase=complete");
  let paid = false,
    checks = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url === "/api/account") {
        checks++;
        return Promise.resolve(json({ entitlement: paid ? "paid" : "free" }));
      }
      return Promise.resolve(json({ profile: record, entitlement: "free" }));
    }),
  );
  render(<StudioEditor demo={false} />);
  await screen.findByLabelText("Display name");
  const check = await screen.findByRole("button", { name: "Check payment status" });
  await waitFor(() => expect((check as HTMLButtonElement).disabled).toBe(false));
  expect(checks).toBe(2);
  paid = true;
  fireEvent.click(check);
  expect(await screen.findByText("Premium account")).toBeTruthy();
});
