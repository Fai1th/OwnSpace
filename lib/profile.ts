import { z } from "zod";
import { websiteSchema } from "./website";
import { siteSettingsSchema } from "./site-settings";
import { FREE_LIMITS, FREE_SITE_STYLE, freeWebsite } from "./plans";
const reserved = new Set([
  "api",
  "studio",
  "signin",
  "signup",
  "sign-in",
  "sign-up",
  "pricing",
  "privacy",
  "terms",
  "cookies",
  "settings",
  "admin",
  "support",
  "examples",
  "preview",
  "report",
  "account",
  "robots",
  "sitemap",
  "favicon",
  "www",
  "ownspace",
  "help",
  "legal",
  "dashboard",
  "editor",
  "acceptable-use",
  "refunds",
  "copyright",
  "subprocessors",
  "privacy-choices",
  "privacy-rights",
]);
export function normalizeHandle(value: string) {
  return value.trim().toLowerCase();
}
export function validateHandle(value: string) {
  return /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(value) && !reserved.has(value);
}
export function safeUrl(value: string) {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" || u.username || u.password) return false;
    const host = u.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      !host.includes(".") ||
      /^[\d.]+$/.test(host) ||
      host.includes(":")
    )
      return false;
    return true;
  } catch {
    return false;
  }
}
export function safeImage(value: string) {
  return (
    value === "" ||
    /^\/art\/[a-z0-9-]+\.svg$/.test(value) ||
    (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length <= 750000)
  );
}
const image = z.string().max(750000).refine(safeImage, "Use an uploaded PNG, JPEG or WebP image.");
export const linkSchema = z.object({
  id: z.string().max(80),
  title: z.string().trim().min(1).max(80),
  url: z.string().max(2048).refine(safeUrl, "Use a valid public HTTPS URL."),
  enabled: z.boolean(),
});
export const profileSchema = z.object({
  handle: z
    .string()
    .transform(normalizeHandle)
    .refine(
      validateHandle,
      "Use 3–30 lowercase letters, numbers or hyphens. This address may be reserved.",
    ),
  displayName: z.string().trim().min(1).max(60),
  bio: z.string().max(280),
  theme: z.enum(["night", "aero", "desktop", "gallery"]),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  avatar: image,
  background: image,
  links: z.array(linkSchema).max(20),
  cards: z
    .array(
      z.object({
        id: z.string().max(80),
        title: z.string().max(80),
        image,
        caption: z.string().max(160),
      }),
    )
    .max(6),
  font: z.enum(["manrope", "mono"]),
  layout: z.enum(["stack", "grid"]),
  showBrand: z.boolean(),
  website: websiteSchema.optional(),
  site: siteSettingsSchema.optional(),
});
export type Profile = z.infer<typeof profileSchema>;
export type ProfileRecord = {
  owner: string;
  handle: string;
  draft: Profile;
  published: Profile | null;
  version: number;
  entitlement: string;
  views: number;
  updatedAt: string;
};
export function canUsePremium(status: string) {
  return status === "paid";
}
export function sanitizeProfile(profile: Profile, premium: boolean): Profile {
  if (premium) return profile;
  const cards = profile.cards.slice(0, FREE_LIMITS.images);
  return {
    ...profile,
    accent: "#BEDD76",
    font: "manrope",
    layout: "stack",
    theme: "night",
    showBrand: true,
    background: "",
    links: profile.links.slice(0, FREE_LIMITS.links),
    cards,
    website: freeWebsite(
      profile.website,
      FREE_LIMITS.images - cards.length,
      FREE_LIMITS.links - Math.min(profile.links.length, FREE_LIMITS.links),
    ),
    ...(profile.site ? { site: { ...FREE_SITE_STYLE, mode: profile.site.mode } } : {}),
  };
}
export const emptyProfile: Profile = {
  handle: "your-name",
  displayName: "Your name",
  bio: "A little about you. A few things you love.",
  theme: "night",
  accent: "#BEDD76",
  avatar: "",
  background: "",
  links: [],
  cards: [],
  font: "manrope",
  layout: "stack",
  showBrand: true,
};
export const themes = [
  { id: "night", name: "After dark", description: "Quiet contrast. Room for your personality." },
  { id: "aero", name: "Open sky", description: "A softer place to land." },
  { id: "desktop", name: "Desktop", description: "Everything you love, in its own window." },
  { id: "gallery", name: "Gallery", description: "Make a little exhibition of your life." },
] as const;
