import { Composio } from "@composio/core";
import { ApiError } from "./http";
export function githubEnabled() {
  return Boolean(process.env.COMPOSIO_API_KEY && process.env.COMPOSIO_GITHUB_AUTH_CONFIG_ID);
}
export function composio() {
  if (!githubEnabled()) throw new ApiError("GitHub importing is not configured.", 503);
  return new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
}
export async function verifiedConnection(owner: string, id: string) {
  const list = await composio().connectedAccounts.list({
    userIds: [owner],
    authConfigIds: [process.env.COMPOSIO_GITHUB_AUTH_CONFIG_ID!],
    toolkitSlugs: ["github"],
    statuses: ["ACTIVE"],
    limit: 100,
  });
  if (!list.items.some((x) => x.id === id && !x.isDisabled))
    throw new ApiError("Reconnect your GitHub account.", 409);
  return id;
}
