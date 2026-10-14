import { z } from "zod";
import { getRepository } from "@/lib/db";
import { ApiError, apiError, assertOrigin, ownerId, readJson } from "@/lib/http";
import { canUsePremium, profileSchema, sanitizeProfile } from "@/lib/profile";
import { buildSiteSourceExport } from "@/lib/site-source-export";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const owner = await ownerId();
    const repository = await getRepository();
    const premium = canUsePremium(await repository.entitlement(owner));
    if (!premium)
      throw new ApiError(
        "React source export is included with Ownspace Premium. Upgrade to download your website code.",
        403,
      );
    const result = z.object({ profile: profileSchema }).safeParse(await readJson(request, 1700000));
    if (!result.success)
      throw new ApiError(
        result.error.issues[0]?.message || "Check your website details before exporting.",
      );
    const profile = sanitizeProfile(result.data.profile, premium);
    const archive = await buildSiteSourceExport(profile);
    return new Response(new Uint8Array(archive), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="ownspace-${profile.handle}.zip"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
