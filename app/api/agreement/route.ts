import { z } from "zod";
import { getRepository } from "@/lib/db";
import { LEGAL_VERSION } from "@/lib/legal-content";
import { ownerId, assertOrigin, readJson, apiError, json, ApiError } from "@/lib/http";
export async function GET() {
  try {
    const owner = await ownerId();
    const receipt = await (await getRepository()).agreement(owner, LEGAL_VERSION);
    return json({ version: LEGAL_VERSION, accepted: Boolean(receipt), receipt });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const owner = await ownerId();
    const data = z
      .object({
        version: z.literal(LEGAL_VERSION),
        acceptedTerms: z.literal(true),
        ageConfirmed: z.literal(true),
      })
      .safeParse(await readJson(request, 1000));
    if (!data.success)
      throw new ApiError("Read the current Terms and confirm your eligibility before continuing.");
    const repo = await getRepository();
    if (!(await repo.rateLimit("agreement:" + owner, 10)))
      throw new ApiError("Please try again in a minute.", 429);
    const receipt = await repo.acceptAgreement(owner, LEGAL_VERSION);
    return json({ version: LEGAL_VERSION, accepted: true, receipt });
  } catch (error) {
    return apiError(error);
  }
}
