import { z } from "zod";
import { profileSchema, linkSchema, type Profile } from "./profile";
const draftSchema = profileSchema.extend({
  handle: z.string().max(30),
  displayName: z.string().max(60),
  links: z
    .array(linkSchema.extend({ title: z.string().max(80), url: z.string().max(2048) }))
    .max(20),
});
export function reconcileSavedDraft(submitted: Profile, current: Profile, saved: Profile): Profile {
  return Object.fromEntries(
    (Object.keys(saved) as (keyof Profile)[]).map((key) => [
      key,
      JSON.stringify(current[key]) === JSON.stringify(submitted[key]) ? saved[key] : current[key],
    ]),
  ) as Profile;
}
export function readDraft(raw: string | null): Profile | null {
  try {
    if (!raw) return null;
    const p = draftSchema.safeParse(JSON.parse(raw));
    return p.success ? p.data : null;
  } catch {
    return null;
  }
}
