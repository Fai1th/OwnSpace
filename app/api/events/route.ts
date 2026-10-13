import { cookies } from "next/headers";
import { z } from "zod";
import { createHash } from "node:crypto";
import { readConsent, allowsTracking, CONSENT_KEY } from "@/lib/consent";
import { getRepository } from "@/lib/db";
import { assertOrigin, readJson, apiError, json, ApiError } from "@/lib/http";
import { validateHandle } from "@/lib/profile";
export async function POST(req: Request) {
  try {
    assertOrigin(req);
    const consent = readConsent((await cookies()).get(CONSENT_KEY)?.value || null);
    if (!allowsTracking(consent, "analytics", req.headers.get("sec-gpc") === "1"))
      return json({ recorded: false });
    const p = z
      .object({ handle: z.string().refine(validateHandle) })
      .safeParse(await readJson(req, 1000));
    if (!p.success) throw new ApiError("Invalid page.");
    const repo = await getRepository();
    const key = createHash("sha256")
      .update((req.headers.get("x-forwarded-for") || "anonymous") + p.data.handle)
      .digest("hex");
    if (await repo.rateLimit("view:" + key, 1, 3600)) await repo.view(p.data.handle);
    return json({ recorded: true });
  } catch (e) {
    return apiError(e);
  }
}
