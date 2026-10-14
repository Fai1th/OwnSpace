"use client";
import { useState } from "react";
import {
  premiumCatalog,
  premiumElementTypes,
  type PremiumElementType,
  type PremiumElementProps,
} from "@/lib/premium-elements";
import { createPremiumComponents } from "./website-editor-premium";
import type { Config, Data, Slot } from "@puckeditor/core";
import type { Profile } from "@/lib/profile";
import type { WebsiteLeaf } from "@/lib/website";
import { optimizeImage } from "@/lib/image-upload";
import { ProfileView } from "./profile-view";
import { WebsiteLeafView, WebsiteSection } from "./website-blocks";
type LeafProps<T extends WebsiteLeaf["type"]> = Omit<
  Extract<WebsiteLeaf, { type: T }>["props"],
  "id"
>;
export type WebsiteProps = { [T in PremiumElementType]: Omit<PremiumElementProps, "id"> } & {
  Heading: LeafProps<"Heading">;
  Text: LeafProps<"Text">;
  Link: LeafProps<"Link">;
  Image: LeafProps<"Image">;
  Spacer: LeafProps<"Spacer">;
  Section: {
    tone: "plain" | "soft" | "outline";
    padding: "small" | "medium" | "large";
    mobilePadding: "small" | "medium" | "large";
    content: Slot;
  };
};
export type WebsiteData = Data<WebsiteProps, Record<string, never>>;
const sizes = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];
const alignment = {
  type: "radio" as const,
  label: "Alignment",
  options: [
    { label: "Left", value: "left" },
    { label: "Center", value: "center" },
    { label: "Right", value: "right" },
  ],
};
const typography = {
  size: { type: "select" as const, label: "Desktop size", options: sizes },
  mobileSize: { type: "select" as const, label: "Mobile size", options: sizes },
  align: alignment,
};
function ImageUpload({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="website-upload">
      <label>
        Image file
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
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
      </label>
      {busy && <span role="status">Preparing image…</span>}
      {value && (
        <>
          <img src={value} alt="Selected image" />
          <button type="button" onClick={() => onChange("")}>
            Remove image
          </button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
export function createWebsiteConfig(
  profile: Profile,
  premium = false,
  search = "",
): Config<WebsiteProps, Record<string, never>> {
  return {
    categories: {
      other: { visible: false },
      content: { title: "Content", components: ["Heading", "Text", "Link", "Image"] },
      layout: { title: "Layout", components: premium ? ["Section", "Spacer"] : ["Spacer"] },
      ...Object.fromEntries(
        ["Structure", "Content", "Media", "Interactive", "Motion"].map((category) => [
          category,
          {
            title: category + " · Premium",
            components: premiumCatalog
              .filter(
                (entry) =>
                  entry.category === category &&
                  (entry.label + " " + entry.description)
                    .toLowerCase()
                    .includes(search.toLowerCase()),
              )
              .map((entry) => entry.type),
            visible: premium,
          },
        ]),
      ),
    },
    root: {
      fields: {},
      render: ({ children }) => (
        <ProfileView
          profile={profile}
          interactive={false}
          websiteContent={<div className="website-surface">{children}</div>}
        />
      ),
    },
    components: {
      ...(Object.fromEntries(
        Object.entries(createPremiumComponents()).map(([type, component]) => [
          type,
          { ...component, permissions: { insert: premium, duplicate: premium } },
        ]),
      ) as ReturnType<typeof createPremiumComponents>),
      Heading: {
        label: "Heading",
        fields: { text: { type: "text", label: "Heading" }, ...typography },
        defaultProps: {
          text: "Your heading",
          size: "large",
          mobileSize: "medium",
          align: "left",
        },
        render: ({ text, size, mobileSize, align, id }) => (
          <WebsiteLeafView
            block={{ type: "Heading", props: { id, text, size, mobileSize, align } }}
          />
        ),
      },
      Text: {
        label: "Text",
        fields: { text: { type: "textarea", label: "Text" }, ...typography },
        defaultProps: {
          text: "Add your text.",
          size: "medium",
          mobileSize: "medium",
          align: "left",
        },
        render: ({ text, size, mobileSize, align, id }) => (
          <WebsiteLeafView block={{ type: "Text", props: { id, text, size, mobileSize, align } }} />
        ),
      },
      Link: {
        label: "Button link",
        fields: {
          label: { type: "text", label: "Label" },
          url: { type: "text", label: "Public HTTPS URL" },
          align: alignment,
        },
        defaultProps: { label: "Explore my work", url: "https://example.com", align: "left" },
        render: ({ id, label, url, align }) => (
          <WebsiteLeafView
            block={{ type: "Link", props: { id, label, url, align } }}
            interactive={false}
          />
        ),
      },
      Image: {
        label: "Image",
        fields: {
          image: {
            type: "custom",
            label: "Upload image",
            render: ({ value, onChange }) => <ImageUpload value={value} onChange={onChange} />,
          },
          alt: { type: "text", label: "Image description (accessibility)" },
          caption: { type: "textarea", label: "Caption" },
          shape: {
            type: "select",
            label: "Crop",
            options: [
              { label: "Natural", value: "natural" },
              { label: "Square", value: "square" },
              { label: "Wide", value: "wide" },
            ],
          },
        },
        defaultProps: { image: "", alt: "", caption: "", shape: "natural" },
        render: ({ id, image, alt, caption, shape }) => (
          <WebsiteLeafView block={{ type: "Image", props: { id, image, alt, caption, shape } }} />
        ),
      },
      Spacer: {
        label: "Space",
        fields: {
          size: { type: "select", label: "Desktop spacing", options: sizes },
          mobileSize: { type: "select", label: "Mobile spacing", options: sizes },
        },
        defaultProps: { size: "medium", mobileSize: "small" },
        render: ({ id, size, mobileSize }) => (
          <WebsiteLeafView block={{ type: "Spacer", props: { id, size, mobileSize } }} />
        ),
      },
      Section: {
        label: "Section · Premium",
        permissions: { insert: premium, duplicate: premium },
        fields: {
          tone: {
            type: "select",
            label: "Surface",
            options: [
              { label: "Plain", value: "plain" },
              { label: "Soft", value: "soft" },
              { label: "Outline", value: "outline" },
            ],
          },
          padding: { type: "select", label: "Desktop padding", options: sizes },
          mobilePadding: { type: "select", label: "Mobile padding", options: sizes },
          content: {
            type: "slot",
            allow: ["Heading", "Text", "Link", "Image", "Spacer", ...premiumElementTypes],
          },
        },
        defaultProps: { tone: "soft", padding: "medium", mobilePadding: "small", content: [] },
        render: ({ tone, padding, mobilePadding, content: Content }) => (
          <WebsiteSection tone={tone} padding={padding} mobilePadding={mobilePadding}>
            <Content className="website-section-content" minEmptyHeight={90} />
          </WebsiteSection>
        ),
      },
    },
  };
}
