import type { Profile } from "./profile";
import type { WebsiteDocument } from "./website";
export const FREE_LIMITS = { blocks: 6, links: 3, images: 1 } as const;
export const PREMIUM_LIMITS = { blocks: 40, links: 20, images: 6 } as const;
export const FREE_SITE_STYLE = {
  backgroundColor: "#171717",
  foreground: "#fbfcfd",
  backgroundImage: "",
  pattern: "none" as const,
  width: "standard" as const,
};
const basic = new Set(["Heading", "Text", "Link", "Image", "Spacer"]);
export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}
export function planIssue(profile: Profile, premium: boolean): string | null {
  if (premium) return null;
  if (
    profile.links.length +
      (profile.website?.content.filter((block) => block.type === "Link").length || 0) >
    FREE_LIMITS.links
  )
    return "Free includes up to 3 links. Remove extra links or upgrade to Premium.";
  if (profile.website && profile.website.content.some((block) => !basic.has(block.type)))
    return "This element is available with Premium. Remove it or upgrade before saving.";
  if ((profile.website?.content.length || 0) > FREE_LIMITS.blocks)
    return "Free includes 6 basic blocks. Remove extra blocks or upgrade to Premium.";
  const images =
    profile.cards.length +
    (profile.website?.content.filter((block) => block.type === "Image").length || 0);
  if (images > FREE_LIMITS.images)
    return "Free includes 1 content image. Remove extra images or upgrade to Premium.";
  if (profile.background) return "Custom backgrounds are available with Premium.";
  if (profile.site) {
    for (const key of Object.keys(FREE_SITE_STYLE) as (keyof typeof FREE_SITE_STYLE)[]) {
      if (profile.site[key] !== FREE_SITE_STYLE[key])
        return "Custom site appearance and backgrounds are available with Premium.";
    }
  }
  return null;
}
export function assertPlanAllows(profile: Profile, premium: boolean): void {
  const issue = planIssue(profile, premium);
  if (issue) throw new PlanLimitError(issue);
}
export function freeWebsite(
  document: WebsiteDocument | undefined,
  imageBudget: number,
  linkBudget: number = FREE_LIMITS.links,
): WebsiteDocument | undefined {
  if (!document) return;
  let images = 0,
    links = 0;
  return {
    version: 1,
    root: { props: {} },
    content: document.content
      .filter(
        (block) =>
          basic.has(block.type) &&
          (block.type !== "Image" || ++images <= imageBudget) &&
          (block.type !== "Link" || ++links <= linkBudget),
      )
      .slice(0, FREE_LIMITS.blocks),
  };
}
