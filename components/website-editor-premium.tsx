"use client";
import { useState } from "react";
import type { ComponentConfig, Field } from "@puckeditor/core";
import { premiumCatalog } from "../lib/premium-elements";
import type {
  PremiumCatalogEntry,
  PremiumElementProps,
  PremiumElementType,
} from "../lib/premium-elements";
import { optimizeImage } from "../lib/image-upload";
import { PremiumElementView } from "./premium-elements";

function PremiumImageUpload({
  id,
  value,
  onChange,
  readOnly,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="premium-editor-image">
      <label htmlFor={id}>Upload image (PNG, JPEG or WebP)</label>
      <input
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        disabled={busy || readOnly}
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0];
          if (!file) return;
          setBusy(true);
          setError("");
          try {
            onChange(await optimizeImage(file));
          } catch (error) {
            setError(error instanceof Error ? error.message : "Unable to read this image.");
          } finally {
            setBusy(false);
          }
        }}
      />
      {busy && <span role="status">Preparing image…</span>}
      {value && (
        <>
          <img src={value} alt="Selected image preview" />
          <button type="button" disabled={readOnly || busy} onClick={() => onChange("")}>
            Remove image
          </button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
const imageField: Field = {
  type: "custom",
  label: "Image",
  render: ({ id, value, onChange, readOnly }) => (
    <PremiumImageUpload id={id} value={value || ""} onChange={onChange} readOnly={readOnly} />
  ),
};
const sharedProps: Record<string, Field> = {
  title: { type: "text", label: "Section title" },
  text: { type: "textarea", label: "Description" },
  label: { type: "text", label: "Button label" },
  url: { type: "text", label: "Button link (public HTTPS URL or #section)" },
  image: imageField,
  align: {
    type: "radio",
    label: "Text alignment",
    options: [
      { label: "Left", value: "left" },
      { label: "Center", value: "center" },
      { label: "Right", value: "right" },
    ],
  },
  variant: {
    type: "select",
    label: "Section style",
    options: [
      { label: "Plain", value: "plain" },
      { label: "Soft accent", value: "soft" },
      { label: "Outline", value: "outline" },
    ],
  },
  columns: {
    type: "select",
    label: "Desktop columns",
    options: [1, 2, 3, 4].map((value) => ({ label: String(value), value })),
  },
  anchor: { type: "text", label: "Section anchor (for example: work)" },
  date: { type: "text", label: "Event date (YYYY-MM-DD or ISO date with timezone)" },
  value: { type: "number", label: "Percentage", min: 0, max: 100, step: 1 },
  email: { type: "text", label: "Contact email" },
};
const fieldsByType: Record<PremiumElementType, string[]> = {
  SiteNav: ["title", "items", "label", "url"],
  Hero: ["title", "text", "label", "url", "image"],
  SplitHero: ["title", "text", "image", "label", "url"],
  FeatureGrid: ["title", "text", "items", "columns"],
  Cards: ["title", "text", "items", "columns"],
  ProjectGrid: ["title", "text", "items", "columns"],
  Gallery: ["title", "text", "items", "columns"],
  Carousel: ["title", "text", "items"],
  Accordion: ["title", "text", "items"],
  Tabs: ["title", "text", "items"],
  PricingTable: ["title", "text", "items", "columns", "label"],
  CallToAction: ["title", "text", "label", "url"],
  Stats: ["title", "text", "items", "columns"],
  Timeline: ["title", "text", "items"],
  Quote: ["text", "title", "label", "image"],
  LogoCloud: ["title", "text", "items"],
  Divider: ["label"],
  Badge: ["label"],
  Checklist: ["title", "text", "items"],
  ImageCompare: ["title", "text", "image", "label", "items", "value"],
  CodeBlock: ["title", "text", "label"],
  Countdown: ["title", "text", "date", "label"],
  Contact: ["title", "text", "email", "label"],
  SiteFooter: ["title", "text", "items"],
  Marquee: ["items"],
  Spotlight: ["title", "text", "label", "url"],
  Announcement: ["title", "text", "label", "url"],
  Steps: ["title", "text", "items", "columns"],
  SocialLinks: ["title", "text", "items"],
  Progress: ["title", "text", "value"],
};
function itemField(type: PremiumElementType): Field {
  const links = [
    "SiteNav",
    "SiteFooter",
    "SocialLinks",
    "Cards",
    "ProjectGrid",
    "PricingTable",
    "FeatureGrid",
    "LogoCloud",
  ].includes(type);
  const images = [
    "Cards",
    "ProjectGrid",
    "Gallery",
    "Carousel",
    "LogoCloud",
    "ImageCompare",
    "Tabs",
  ].includes(type);
  const text = ![
    "SiteNav",
    "SiteFooter",
    "Gallery",
    "LogoCloud",
    "ImageCompare",
    "Marquee",
  ].includes(type);
  return {
    type: "array",
    label:
      type === "ImageCompare"
        ? "After image"
        : type === "PricingTable"
          ? "Plans"
          : type === "Accordion"
            ? "Questions and answers"
            : type === "Tabs"
              ? "Tabs"
              : "Items",
    max: type === "ImageCompare" ? 1 : 8,
    arrayFields: {
      title: {
        type: "text",
        label:
          type === "Accordion"
            ? "Question"
            : type === "Stats"
              ? "Number / fact"
              : type === "ImageCompare"
                ? "After label / image description"
                : "Title / image description",
      },
      ...(text
        ? {
            text: {
              type: "textarea" as const,
              label:
                type === "PricingTable"
                  ? "Price on first line, then one feature per line"
                  : type === "Accordion"
                    ? "Answer"
                    : type === "Stats"
                      ? "What this measures"
                      : "Description",
            },
          }
        : {}),
      ...(links ? { url: { type: "text" as const, label: "Public HTTPS URL or #section" } } : {}),
      ...(images ? { image: imageField } : {}),
    },
    defaultItemProps: {
      title: type === "Accordion" ? "Your question" : "Your item",
      text: "",
      url: "",
      image: "",
    },
    getItemSummary: (item: PremiumElementProps["items"][number], index?: number) =>
      item.title || "Item " + ((index || 0) + 1),
  };
}
function fieldsFor(entry: PremiumCatalogEntry): Record<string, Field> {
  const fields = Object.fromEntries(
    fieldsByType[entry.type].map((key) => [
      key,
      key === "items" ? itemField(entry.type) : sharedProps[key],
    ]),
  );
  if (entry.type === "Quote") {
    fields.title = { type: "text", label: "Quote author" };
    fields.text = { type: "textarea", label: "Quotation (use with permission)" };
    fields.label = { type: "text", label: "Role or source" };
  }
  if (entry.type === "CodeBlock") {
    fields.text = { type: "textarea", label: "Code (displayed as text)" };
    fields.label = {
      type: "select",
      label: "Language",
      options: [
        "javascript",
        "typescript",
        "jsx",
        "tsx",
        "css",
        "markup",
        "json",
        "bash",
        "python",
      ].map((value) => ({ label: value, value })),
    };
  }
  if (entry.type === "Countdown")
    fields.label = { type: "text", label: "Message after event starts" };
  if (entry.type === "ImageCompare") {
    fields.label = { type: "text", label: "Before label / image description" };
    fields.image = { ...imageField, label: "Before image" };
    fields.value = { ...sharedProps.value, label: "Starting comparison position (%)" };
  }
  if (entry.type === "Divider" || entry.type === "Badge")
    fields.label = { type: "text", label: "Display label" };
  if (entry.type === "SiteNav" || entry.type === "SiteFooter")
    fields.title = { type: "text", label: "Site / brand name" };
  return {
    ...fields,
    align: sharedProps.align,
    variant: sharedProps.variant,
    anchor: sharedProps.anchor,
  };
}
export function createPremiumComponents(): Record<
  PremiumElementType,
  ComponentConfig<Omit<PremiumElementProps, "id">>
> {
  return Object.fromEntries(
    premiumCatalog.map((entry) => [
      entry.type,
      {
        label: entry.label + " · Premium",
        fields: fieldsFor(entry),
        defaultProps: structuredClone(entry.defaults),
        metadata: { premium: true, description: entry.description, source: entry.source },
        render: (renderProps: PremiumElementProps) => {
          const props = Object.fromEntries(
            Object.keys(entry.defaults).map((key) => [
              key,
              renderProps[key as keyof PremiumElementProps] ??
                entry.defaults[key as keyof typeof entry.defaults],
            ]),
          ) as Omit<PremiumElementProps, "id">;
          return (
            <PremiumElementView
              element={{ type: entry.type, props: { ...props, id: renderProps.id } }}
              interactive={false}
            />
          );
        },
      },
    ]),
  ) as unknown as Record<PremiumElementType, ComponentConfig<Omit<PremiumElementProps, "id">>>;
}
export const premiumCategories = Object.fromEntries(
  ["Structure", "Content", "Media", "Interactive", "Motion"].map((category) => [
    "premium" + category,
    {
      title: category + " · Premium",
      components: premiumCatalog
        .filter((entry) => entry.category === category)
        .map((entry) => entry.type),
    },
  ]),
);
