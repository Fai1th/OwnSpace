import { z } from "zod";
import { websiteImage } from "./site-safety";
export const siteSettingsSchema = z
  .object({
    mode: z.enum(["website", "profile"]),
    backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    foreground: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    backgroundImage: z
      .string()
      .max(350000)
      .refine(websiteImage, "Choose an uploaded background image."),
    pattern: z.enum(["none", "grid", "dots", "lines"]),
    width: z.enum(["narrow", "standard", "wide"]),
  })
  .strict();
export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export const defaultSiteSettings: SiteSettings = {
  mode: "website",
  backgroundColor: "#171717",
  foreground: "#fbfcfd",
  backgroundImage: "",
  pattern: "none",
  width: "standard",
};
