import { it, expect, vi, beforeEach } from "vitest";
const s = vi.hoisted(() => ({
  id: "connection-1" as string | undefined,
  provider: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("../lib/db", () => ({
  getRepository: async () => ({ connection: async () => s.id, delete: s.remove }),
}));
vi.mock("../lib/github", () => ({
  githubEnabled: () => true,
  composio: () => ({ connectedAccounts: { delete: s.provider } }),
}));
import { cleanup } from "../lib/account-cleanup";
beforeEach(() => {
  s.id = "connection-1";
  s.provider.mockReset();
  s.remove.mockReset();
});
it("revokes a GitHub connection before removing its stored ID", async () => {
  await cleanup("owner");
  expect(s.provider).toHaveBeenCalledWith("connection-1");
  expect(s.remove).toHaveBeenCalledWith("owner", false);
  expect(s.provider.mock.invocationCallOrder[0]).toBeLessThan(s.remove.mock.invocationCallOrder[0]);
});
it("keeps cleanup retryable when the provider fails", async () => {
  s.provider.mockRejectedValueOnce(Error("offline"));
  await expect(cleanup("owner", true)).rejects.toThrow("offline");
  expect(s.remove).not.toHaveBeenCalled();
});
it("accepts an already revoked connection when a deletion is retried", async () => {
  s.provider.mockRejectedValueOnce(Object.assign(Error("gone"), { status: 404 }));
  await cleanup("owner", true);
  expect(s.remove).toHaveBeenCalledWith("owner", true);
});
