import { z } from "zod";
// Public documents contain data, never HTML, CSS, JavaScript or executable embeds.
export function websiteUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      host.includes(".") &&
      host !== "localhost" &&
      !host.endsWith(".localhost") &&
      !host.endsWith(".local") &&
      !/^[\d.]+$/.test(host) &&
      !host.includes(":")
    );
  } catch {
    return false;
  }
}
export function websiteImage(value: string) {
  return (
    value === "" ||
    /^\/art\/[a-z0-9-]+\.svg$/.test(value) ||
    (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length <= 350000)
  );
}
const id = z
  .string()
  .min(1)
  .max(80)
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/,
    "Block IDs must use letters, numbers, underscores or hyphens.",
  )
  .refine((value) => value !== "root", "This block ID is reserved.");
const align = z.enum(["left", "center", "right"]);
const size = z.enum(["small", "medium", "large"]);
const heading = z
  .object({
    type: z.literal("Heading"),
    props: z.object({ id, text: z.string().max(160), size, mobileSize: size, align }).strict(),
  })
  .strict();
const text = z
  .object({
    type: z.literal("Text"),
    props: z.object({ id, text: z.string().max(4000), size, mobileSize: size, align }).strict(),
  })
  .strict();
const link = z
  .object({
    type: z.literal("Link"),
    props: z
      .object({
        id,
        label: z.string().min(1, "Give your button a label.").max(100),
        url: z.string().max(2048).refine(websiteUrl, "Use a valid public HTTPS link."),
        align,
      })
      .strict(),
  })
  .strict();
const image = z
  .object({
    type: z.literal("Image"),
    props: z
      .object({
        id,
        image: z
          .string()
          .max(350000)
          .refine(websiteImage, "Choose an uploaded PNG, JPEG or WebP image."),
        alt: z.string().max(160),
        caption: z.string().max(240),
        shape: z.enum(["natural", "square", "wide"]),
      })
      .strict(),
  })
  .strict();
const spacer = z
  .object({ type: z.literal("Spacer"), props: z.object({ id, size, mobileSize: size }).strict() })
  .strict();
export const websiteLeafSchema = z.discriminatedUnion("type", [heading, text, link, image, spacer]);
const section = z
  .object({
    type: z.literal("Section"),
    props: z
      .object({
        id,
        tone: z.enum(["plain", "soft", "outline"]),
        padding: size,
        mobilePadding: size,
        content: z.array(websiteLeafSchema).max(20),
      })
      .strict(),
  })
  .strict();
export const websiteBlockSchema = z.discriminatedUnion("type", [
  heading,
  text,
  link,
  image,
  spacer,
  section,
]);
export const websiteSchema = z
  .object({
    version: z.literal(1),
    root: z.object({ props: z.object({}).strict() }).strict(),
    content: z.array(websiteBlockSchema).max(40),
  })
  .strict()
  .superRefine((document, ctx) => {
    const ids = new Set<string>();
    let count = 0;
    for (const block of document.content) {
      for (const item of [block, ...(block.type === "Section" ? block.props.content : [])]) {
        count++;
        if (ids.has(item.props.id))
          ctx.addIssue({ code: "custom", message: "Every block needs a unique ID." });
        ids.add(item.props.id);
      }
    }
    if (count > 40)
      ctx.addIssue({ code: "custom", message: "Keep your website to 40 blocks or fewer." });
    if (JSON.stringify(document).length > 1100000)
      ctx.addIssue({
        code: "custom",
        message: "Your website is too large. Use fewer or smaller images.",
      });
  });
export type WebsiteDocument = z.infer<typeof websiteSchema>;
export type WebsiteBlock = z.infer<typeof websiteBlockSchema>;
export type WebsiteLeaf = z.infer<typeof websiteLeafSchema>;
export const emptyWebsite: WebsiteDocument = { version: 1, root: { props: {} }, content: [] };
export function toWebsiteDocument(data: { root: unknown; content: unknown }): WebsiteDocument {
  return websiteSchema.parse({ version: 1, root: data.root, content: data.content });
}

// Puck and Zod may serialize equal properties in a different order. Dirty checks
// compare values, so a successful save does not reset the editor's undo history.
export function websiteDraftFingerprint(value: unknown): string {
  return (
    JSON.stringify(value, (_key, item) =>
      item && typeof item === "object" && !Array.isArray(item)
        ? Object.fromEntries(
            Object.keys(item)
              .sort()
              .map((key) => [key, item[key]]),
          )
        : item,
    ) ?? ""
  );
}
export function reconcileWebsiteDraft<T extends object>(submitted: T, current: T, saved: T): T {
  return Object.fromEntries(
    (Object.keys(saved) as (keyof T)[]).map((key) => [
      key,
      websiteDraftFingerprint(current[key]) === websiteDraftFingerprint(submitted[key])
        ? saved[key]
        : current[key],
    ]),
  ) as T;
}
