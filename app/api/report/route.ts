import { z } from "zod";
import { createHash } from "node:crypto";
import { getRepository } from "@/lib/db";
import { validateHandle } from "@/lib/profile";
import { assertOrigin, readJson, apiError, json, ApiError } from "@/lib/http";
export async function POST(req: Request) {
  try {
    assertOrigin(req);
    const p = z
      .object({
        handle: z.string().refine(validateHandle),
        reason: z.enum(["harassment", "illegal-content", "impersonation", "copyright", "other"]),
        details: z.string().trim().min(10).max(2000),
        website: z.string().max(0),
      })
      .safeParse(await readJson(req, 5000));
    if (!p.success)
      throw new ApiError("Please give a reason and at least 10 characters of detail.");
    const repo = await getRepository();
    const key = createHash("sha256")
      .update(req.headers.get("x-forwarded-for") || "anonymous")
      .digest("hex")
      .slice(0, 20);
    if (!(await repo.rateLimit("report:" + key, 5, 3600)))
      throw new ApiError("Please try again later.", 429);
    await repo.report(p.data.handle, p.data.reason, p.data.details);
    return json({ received: true });
  } catch (e) {
    return apiError(e);
  }
}
