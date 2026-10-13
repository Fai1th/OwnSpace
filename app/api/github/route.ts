import { z } from "zod";
import { getRepository } from "@/lib/db";
import { composio, githubEnabled, verifiedConnection } from "@/lib/github";
import { getSiteUrl } from "@/lib/config";
import { safeUrl } from "@/lib/profile";
import { ownerId, assertOrigin, apiError, json, ApiError } from "@/lib/http";
export async function GET() {
  try {
    const owner = await ownerId();
    const repo = await getRepository();
    const id = await repo.connection(owner);
    if (!githubEnabled()) return json({ configured: false, connected: false, repos: [] });
    if (!id) return json({ configured: true, connected: false, repos: [] });
    await verifiedConnection(owner, id);
    const result = await composio().tools.proxyExecute({
      userId: owner,
      connectedAccountId: id,
      method: "GET",
      endpoint: "/user/repos",
      parameters: [
        { in: "query", name: "visibility", value: "public" },
        { in: "query", name: "sort", value: "updated" },
        { in: "query", name: "per_page", value: 30 },
      ],
    });
    if (result.status >= 400)
      throw new ApiError("GitHub couldn't load your repositories. Try reconnecting.", 502);
    const schema = z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        html_url: z.string(),
        description: z.string().nullable(),
        private: z.boolean(),
        stargazers_count: z.number().optional(),
      }),
    );
    const parsed = schema.safeParse(result.data);
    if (!parsed.success) throw new ApiError("GitHub returned an unexpected response.", 502);
    return json({
      configured: true,
      connected: true,
      repos: parsed.data
        .filter((r) => !r.private && safeUrl(r.html_url))
        .map((r) => ({
          id: r.id,
          title: r.name,
          url: r.html_url,
          description: r.description || "",
          stars: r.stargazers_count || 0,
        })),
    });
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(req: Request) {
  try {
    assertOrigin(req);
    const owner = await ownerId();
    const repo = await getRepository();
    if (!(await repo.rateLimit("github:" + owner, 5, 600)))
      throw new ApiError("Please try again later.", 429);
    const old = await repo.connection(owner);
    if (old) {
      try {
        await composio().connectedAccounts.delete(old);
      } catch (e) {
        if ((e as { status?: number }).status !== 404) throw e;
      }
    }
    const request = await composio().connectedAccounts.link(
      owner,
      process.env.COMPOSIO_GITHUB_AUTH_CONFIG_ID!,
      { callbackUrl: getSiteUrl() + "/studio?github=connected", allowMultiple: false },
    );
    await repo.setConnection(owner, request.id);
    return json({ url: request.redirectUrl });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(req: Request) {
  try {
    assertOrigin(req);
    const owner = await ownerId();
    const repo = await getRepository();
    const id = await repo.connection(owner);
    if (id) {
      try {
        await composio().connectedAccounts.delete(id);
      } catch (e) {
        if ((e as { status?: number }).status !== 404) throw e;
      }
      await repo.setConnection(owner, null);
    }
    return json({ disconnected: true });
  } catch (e) {
    return apiError(e);
  }
}
