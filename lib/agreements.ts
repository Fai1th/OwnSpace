import { getRepository } from "./db";
import { ApiError } from "./http";
import { LEGAL_VERSION } from "./legal-content";
export async function requireSiteAgreement(owner: string) {
  if (!(await (await getRepository()).agreement(owner, LEGAL_VERSION)))
    throw new ApiError(
      "Review and accept the current Terms in your dashboard before publishing or purchasing.",
      428,
    );
}
