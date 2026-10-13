// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act, cleanup } from "@testing-library/react";
import { emptyProfile, type ProfileRecord, type Profile } from "../lib/profile";
vi.mock("@clerk/nextjs", () => ({ UserButton: () => null }));
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
  handle: "save-fixture",
  draft: { ...emptyProfile, handle: "save-fixture", displayName: "Alice" },
  published: null,
  version: 1,
  entitlement: "free",
  views: 0,
  updatedAt: "2026-10-13",
};
function response(profile: ProfileRecord) {
  return { ok: true, json: async () => ({ profile }) } as Response;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => (resolve = done));
  return { promise, resolve };
}
beforeEach(() => {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => data.get(key) || null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
    clear: () => data.clear(),
  });
  history.replaceState({}, "", "/studio");
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("keeps edits made while an account save is in flight", async () => {
  const pending = deferred<Response>();
  let submitted: Profile | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, options?: RequestInit) => {
      if (options?.method === "PUT") {
        submitted = JSON.parse(options.body as string).profile;
        return pending.promise;
      }
      return Promise.resolve(response(record));
    }),
  );
  render(<StudioEditor demo={false} />);
  const name = await screen.findByLabelText("Display name");
  fireEvent.change(name, { target: { value: "Saved name" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(submitted?.displayName).toBe("Saved name"));
  fireEvent.change(name, { target: { value: "Newer unsaved name" } });
  await act(async () => pending.resolve(response({ ...record, version: 2, draft: submitted! })));
  expect((screen.getByLabelText("Display name") as HTMLInputElement).value).toBe(
    "Newer unsaved name",
  );
  expect(screen.getByText("Unsaved changes")).toBeTruthy();
});
it("applies the saved server version when nothing was edited during the request", async () => {
  const pending = deferred<Response>();
  let submitted: Profile | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, options?: RequestInit) => {
      if (options?.method === "PUT") {
        submitted = JSON.parse(options.body as string).profile;
        return pending.promise;
      }
      return Promise.resolve(response(record));
    }),
  );
  render(<StudioEditor demo={false} />);
  const name = await screen.findByLabelText("Display name");
  fireEvent.change(name, { target: { value: "  Trimmed name  " } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(submitted).toBeDefined());
  await act(async () =>
    pending.resolve(
      response({ ...record, version: 2, draft: { ...submitted!, displayName: "Trimmed name" } }),
    ),
  );
  expect((screen.getByLabelText("Display name") as HTMLInputElement).value).toBe("Trimmed name");
  expect(screen.getByText("Draft saved")).toBeTruthy();
});
