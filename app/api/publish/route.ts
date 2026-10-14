import { z } from "zod";
import { requireSiteAgreement } from "@/lib/agreements";
import { getRepository } from "@/lib/db";
import { ownerId, assertOrigin, readJson, apiError, json, ApiError } from "@/lib/http";
export async function POST(req: Request) {
  try {
    assertOrigin(req);
    const owner = await ownerId();
    const repo = await getRepository();
    if (!(await repo.rateLimit("publish:" + owner, 20)))
      throw new ApiError("Try again in a minute.", 429);
    const parsed = z
      .object({ publish: z.boolean(), version: z.number().int().min(1) })
      .safeParse(await readJson(req, 1000));
    if (!parsed.success) throw new ApiError("Save your page and try publishing again.");
    if (parsed.data.publish) await requireSiteAgreement(owner);
    return json({ profile: await repo.publish(owner, parsed.data.publish, parsed.data.version) });
  } catch (e) {
    return apiError(e);
  }
}
