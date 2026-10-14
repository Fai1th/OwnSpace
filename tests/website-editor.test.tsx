// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { emptyProfile, type ProfileRecord } from "../lib/profile";
import { emptyWebsite } from "../lib/website";
vi.mock("@puckeditor/core", () => ({
  Puck: ({
    data,
    onChange,
  }: {
    data: { root: unknown; content: unknown[] };
    onChange: (data: unknown) => void;
  }) => (
    <div>
      <button
        onClick={() =>
          onChange({
            ...data,
            root: { props: { id: "root" } },
            content: [
              ...data.content,
              {
                type: "Text",
                props: {
                  text: "New paragraph",
                  id: `text-${data.content.length}`,
                  size: "medium",
                  mobileSize: "small",
                  align: "left",
                },
              },
            ],
          })
        }
      >
        Add test paragraph
      </button>
      <span>{data.content.length} blocks</span>
    </div>
  ),
}));
vi.mock("../components/website-editor-config", () => ({
  createWebsiteConfig: () => ({ components: {} }),
}));
import { WebsiteEditor } from "../components/website-editor";
import { clearWebsiteRecoveries } from "../lib/website-recovery";
const record: ProfileRecord = {
  owner: "fixture",
  handle: "page-fixture",
  draft: { ...emptyProfile, handle: "page-fixture", displayName: "Alice", website: emptyWebsite },
  published: null,
  version: 4,
  entitlement: "free",
  views: 0,
  updatedAt: "2026-10-14",
};
function response(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}
afterEach(() => {
  cleanup();
  clearWebsiteRecoveries();
  vi.unstubAllGlobals();
});
it("preserves edits made during save and publishes only an explicitly saved version", async () => {
  let finishSave!: (response: Response) => void;
  const pending = new Promise<Response>((resolve) => {
    finishSave = resolve;
  });
  let submitted: { profile: ProfileRecord["draft"]; version: number } | undefined;
  const fetchMock = vi.fn((url: string, options?: RequestInit) => {
    if (options?.method === "PUT") {
      submitted = JSON.parse(options.body as string);
      return pending;
    }
    return Promise.resolve(response({ profile: record, entitlement: "free" }));
  });
  vi.stubGlobal("fetch", fetchMock);
  render(<WebsiteEditor demo={false} />);
  await screen.findByRole("button", { name: "Add test paragraph" });
  fireEvent.click(screen.getByRole("button", { name: "Add test paragraph" }));
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  expect(submitted?.version).toBe(4);
  expect(submitted?.profile.website?.content).toHaveLength(1);
  expect(submitted?.profile.website?.root).toEqual({ props: {} });
  fireEvent.click(screen.getByRole("button", { name: "Add test paragraph" }));
  fireEvent.change(screen.getByLabelText("Display name"), {
    target: { value: "Alice after request" },
  });
  await act(async () => {
    finishSave(response({ profile: { ...record, version: 5, draft: submitted!.profile } }));
  });
  expect((screen.getByLabelText("Display name") as HTMLInputElement).value).toBe(
    "Alice after request",
  );
  expect(screen.getByText("2 blocks")).toBeTruthy();
  expect(screen.getByText(/Unsaved changes/)).toBeTruthy();
  expect(
    (screen.getByRole("button", { name: "Publish saved page" }) as HTMLButtonElement).disabled,
  ).toBe(true);
  expect(fetchMock.mock.calls.filter(([url]) => url === "/api/publish")).toHaveLength(0);
  let savedBody: { profile: ProfileRecord["draft"]; version: number } | undefined;
  fetchMock.mockImplementation((url: string, options?: RequestInit) => {
    if (options?.method === "PUT") {
      savedBody = JSON.parse(options.body as string);
      return Promise.resolve(
        response({ profile: { ...record, draft: savedBody!.profile, version: 6 } }),
      );
    }
    return Promise.resolve(
      response({
        profile: {
          ...record,
          draft: savedBody!.profile,
          published: savedBody!.profile,
          version: 6,
        },
      }),
    );
  });
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await waitFor(() =>
    expect(
      (screen.getByRole("button", { name: "Publish saved page" }) as HTMLButtonElement).disabled,
    ).toBe(false),
  );
  expect(savedBody?.version).toBe(5);
  fireEvent.click(screen.getByRole("button", { name: "Publish saved page" }));
  await screen.findByText("Your saved page is published.");
  const call = fetchMock.mock.calls.find(([url]) => url === "/api/publish")!;
  expect(JSON.parse(call[1]!.body as string)).toEqual({ publish: true, version: 6 });
});
it("retains the local edit on conflict and displays the server message", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, options?: RequestInit) =>
      Promise.resolve(
        options?.method === "PUT"
          ? response({ error: "Your page changed in another tab. Reload before saving." }, false)
          : response({ profile: record, entitlement: "free" }),
      ),
    ),
  );
  render(<WebsiteEditor demo={false} />);
  await screen.findByRole("button", { name: "Add test paragraph" });
  fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Keep my change" } });
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await screen.findByRole("alert");
  expect(screen.getByRole("alert").textContent).toContain("changed in another tab");
  expect((screen.getByLabelText("Display name") as HTMLInputElement).value).toBe("Keep my change");
  expect(screen.getByText(/Unsaved changes/)).toBeTruthy();
});
it("does not expose save controls when the account draft failed to load", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(response({ error: "Database unavailable" }, false))),
  );
  render(<WebsiteEditor demo={false} />);
  await screen.findByRole("alert");
  expect(screen.queryByRole("button", { name: "Save draft" })).toBeNull();
  expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
});

it("imports the browser draft into an empty account and keeps it unsaved until acknowledged", async () => {
  const cached = { ...record.draft, displayName: "Browser draft" };
  vi.stubGlobal("localStorage", { getItem: () => JSON.stringify(cached) });
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(response({ profile: null, entitlement: "free" }))),
  );
  render(<WebsiteEditor demo={false} />);
  await screen.findByRole("button", { name: "Add test paragraph" });
  expect((screen.getByLabelText("Display name") as HTMLInputElement).value).toBe("Browser draft");
  expect(screen.getByText(/Unsaved changes/)).toBeTruthy();
  expect(screen.getByText(/Save it to your account before publishing/)).toBeTruthy();
  expect(
    (screen.getByRole("button", { name: "Publish saved page" }) as HTMLButtonElement).disabled,
  ).toBe(true);
});
it("reflects server-normalized website fields in the next save when no edit intervened", async () => {
  let saves = 0;
  const bodies: { profile: ProfileRecord["draft"]; version: number }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, options?: RequestInit) => {
      if (!options?.method)
        return Promise.resolve(response({ profile: record, entitlement: "free" }));
      const submitted = JSON.parse(options.body as string);
      bodies.push(submitted);
      saves++;
      const normalized = {
        ...submitted.profile,
        website: {
          ...emptyWebsite,
          content: [
            {
              type: "Text",
              props: {
                id: "normalized",
                text: "Normalized text",
                align: "left",
                size: "small",
                mobileSize: "small",
              },
            },
          ],
        },
      };
      return Promise.resolve(
        response({ profile: { ...record, version: 4 + saves, draft: normalized } }),
      );
    }),
  );
  render(<WebsiteEditor demo={false} />);
  await screen.findByRole("button", { name: "Add test paragraph" });
  fireEvent.click(screen.getByRole("button", { name: "Add test paragraph" }));
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await screen.findByRole("status");
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await waitFor(() => expect(bodies).toHaveLength(2));
  expect(bodies[1].profile.website?.content[0].props.id).toBe("normalized");
  expect(bodies[1].version).toBe(5);
});

it("recovers unsaved profile and blocks after same-tab unmount and remount", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(response({ profile: record, entitlement: "free" }))),
  );
  const first = render(<WebsiteEditor demo={false} />);
  await screen.findByRole("button", { name: "Add test paragraph" });
  fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Unsaved on Back" } });
  fireEvent.click(screen.getByRole("button", { name: "Add test paragraph" }));
  first.unmount();
  render(<WebsiteEditor demo={false} />);
  await screen.findByRole("button", { name: "Add test paragraph" });
  expect((screen.getByLabelText("Display name") as HTMLInputElement).value).toBe("Unsaved on Back");
  expect(screen.getByText("1 blocks")).toBeTruthy();
  expect(screen.getByText(/Recovered your unsaved changes/)).toBeTruthy();
  expect(screen.getByText(/Unsaved changes/)).toBeTruthy();
});
it("isolates recovery by authenticated owner, including accounts without saved profiles", async () => {
  let owner = "new-owner-a";
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(response({ owner, profile: null, entitlement: "free" }))),
  );
  const first = render(<WebsiteEditor demo={false} />);
  await screen.findByRole("button", { name: "Add test paragraph" });
  fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Private owner A" } });
  first.unmount();
  owner = "new-owner-b";
  const second = render(<WebsiteEditor demo={false} />);
  await screen.findByRole("button", { name: "Add test paragraph" });
  expect((screen.getByLabelText("Display name") as HTMLInputElement).value).toBe("Your name");
  fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Private owner B" } });
  second.unmount();
  owner = "new-owner-a";
  render(<WebsiteEditor demo={false} />);
  await screen.findByRole("button", { name: "Add test paragraph" });
  expect((screen.getByLabelText("Display name") as HTMLInputElement).value).toBe("Private owner A");
});
it("retains the recovered optimistic version when another tab has saved a newer page", async () => {
  let server = record;
  let savedVersion: number | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, options?: RequestInit) => {
      if (options?.method === "PUT") {
        savedVersion = JSON.parse(options.body as string).version;
        return Promise.resolve(
          response({ error: "Your page changed in another tab. Reload before saving." }, false),
        );
      }
      return Promise.resolve(response({ profile: server, entitlement: "free" }));
    }),
  );
  const first = render(<WebsiteEditor demo={false} />);
  await screen.findByRole("button", { name: "Add test paragraph" });
  fireEvent.change(screen.getByLabelText("Display name"), {
    target: { value: "Keep recovered changes" },
  });
  first.unmount();
  server = {
    ...record,
    version: 5,
    draft: { ...record.draft, displayName: "Remote saved change" },
  };
  render(<WebsiteEditor demo={false} />);
  await screen.findByRole("button", { name: "Add test paragraph" });
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await screen.findByRole("alert");
  expect(savedVersion).toBe(4);
  expect((screen.getByLabelText("Display name") as HTMLInputElement).value).toBe(
    "Keep recovered changes",
  );
});
it("discards recovery when the previously saved page was deleted", async () => {
  let server: ProfileRecord | null = record;
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(response({ owner: record.owner, profile: server, entitlement: "free" })),
    ),
  );
  const first = render(<WebsiteEditor demo={false} />);
  await screen.findByRole("button", { name: "Add test paragraph" });
  fireEvent.change(screen.getByLabelText("Display name"), {
    target: { value: "Deleted private page" },
  });
  first.unmount();
  server = null;
  render(<WebsiteEditor demo={false} />);
  await screen.findByRole("button", { name: "Add test paragraph" });
  expect((screen.getByLabelText("Display name") as HTMLInputElement).value).toBe("Your name");
  expect(screen.queryByText(/Recovered your unsaved changes/)).toBeNull();
});
it("clears acknowledged recovery without clearing edits made during a save", async () => {
  let server = record;
  let resolveSave!: (response: Response) => void;
  const pending = new Promise<Response>((resolve) => {
    resolveSave = resolve;
  });
  let submitted: ProfileRecord["draft"];
  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, options?: RequestInit) => {
      if (options?.method === "PUT") {
        submitted = JSON.parse(options.body as string).profile;
        return pending;
      }
      return Promise.resolve(response({ profile: server, entitlement: "free" }));
    }),
  );
  const first = render(<WebsiteEditor demo={false} />);
  await screen.findByRole("button", { name: "Add test paragraph" });
  fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Submitted" } });
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  fireEvent.change(screen.getByLabelText("Display name"), {
    target: { value: "Newer than submitted" },
  });
  server = { ...record, version: 5, draft: submitted! };
  await act(async () => {
    resolveSave(response({ profile: server }));
  });
  first.unmount();
  render(<WebsiteEditor demo={false} />);
  await screen.findByRole("button", { name: "Add test paragraph" });
  expect((screen.getByLabelText("Display name") as HTMLInputElement).value).toBe(
    "Newer than submitted",
  );
  expect(screen.getByText(/Unsaved changes/)).toBeTruthy();
});
it("clears an acknowledged draft so remount uses newer server content", async () => {
  let server = record;
  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, options?: RequestInit) => {
      if (options?.method === "PUT") {
        server = { ...record, version: 5, draft: JSON.parse(options.body as string).profile };
      }
      return Promise.resolve(response({ profile: server, entitlement: "free" }));
    }),
  );
  const first = render(<WebsiteEditor demo={false} />);
  await screen.findByRole("button", { name: "Add test paragraph" });
  fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Acknowledged" } });
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await screen.findByRole("status");
  first.unmount();
  server = {
    ...server,
    version: 6,
    draft: { ...server.draft, displayName: "Newer saved elsewhere" },
  };
  render(<WebsiteEditor demo={false} />);
  await screen.findByRole("button", { name: "Add test paragraph" });
  expect((screen.getByLabelText("Display name") as HTMLInputElement).value).toBe(
    "Newer saved elsewhere",
  );
  expect(screen.queryByText(/Recovered your unsaved changes/)).toBeNull();
  expect(screen.queryByText(/Unsaved changes/)).toBeNull();
});
it("does not let an old save acknowledgment clear newer edits from a remounted editor", async () => {
  let server = record;
  let resolveSave!: (response: Response) => void;
  const pending = new Promise<Response>((resolve) => {
    resolveSave = resolve;
  });
  let submitted: ProfileRecord["draft"];
  vi.stubGlobal(
    "fetch",
    vi.fn((_url: string, options?: RequestInit) => {
      if (options?.method === "PUT") {
        submitted = JSON.parse(options.body as string).profile;
        return pending;
      }
      return Promise.resolve(response({ profile: server, entitlement: "free" }));
    }),
  );
  const first = render(<WebsiteEditor demo={false} />);
  await screen.findByRole("button", { name: "Add test paragraph" });
  fireEvent.change(screen.getByLabelText("Display name"), {
    target: { value: "In-flight old save" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  first.unmount();
  const second = render(<WebsiteEditor demo={false} />);
  await screen.findByRole("button", { name: "Add test paragraph" });
  fireEvent.change(screen.getByLabelText("Display name"), {
    target: { value: "Remounted newer edit" },
  });
  server = { ...record, version: 5, draft: submitted! };
  await act(async () => {
    resolveSave(response({ profile: server }));
  });
  second.unmount();
  render(<WebsiteEditor demo={false} />);
  await screen.findByRole("button", { name: "Add test paragraph" });
  expect((screen.getByLabelText("Display name") as HTMLInputElement).value).toBe(
    "Remounted newer edit",
  );
  expect(screen.getByText(/Recovered your unsaved changes/)).toBeTruthy();
});
