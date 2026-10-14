import { cleanup } from "@/lib/account-cleanup";
import { z } from "zod";
import { profileSchema } from "@/lib/profile";
import { getRepository } from "@/lib/db";
import { ownerId, assertOrigin, readJson, apiError, json, ApiError } from "@/lib/http";
export async function GET() {
  try {
    const owner = await ownerId();
    const repo = await getRepository();
    const [profile, entitlement] = await Promise.all([repo.get(owner), repo.entitlement(owner)]);
    return json({ owner, profile, entitlement });
  } catch (e) {
    return apiError(e);
  }
}
export async function PUT(req: Request) {
  try {
    assertOrigin(req);
    const owner = await ownerId();
    const repo = await getRepository();
    if (!(await repo.rateLimit("save:" + owner, 30)))
      throw new ApiError("A few too many saves. Try again in a minute.", 429);
    const result = z
      .object({ profile: profileSchema, version: z.number().int().min(0) })
      .safeParse(await readJson(req));
    if (!result.success)
      throw new ApiError(result.error.issues[0]?.message || "Check your page details.");
    return json({ profile: await repo.save(owner, result.data.profile, result.data.version) });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(req: Request) {
  try {
    assertOrigin(req);
    const owner = await ownerId();
    await cleanup(owner);
    return json({ deleted: true });
  } catch (e) {
    return apiError(e);
  }
}
