import React from "react";
import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfileView } from "../components/profile-view";
import { emptyProfile } from "../lib/profile";
import { emptyWebsite, type WebsiteDocument } from "../lib/website";
it("renders trusted website blocks under the existing profile without duplicate h1 headings", () => {
  const website: WebsiteDocument = {
    ...emptyWebsite,
    content: [
      {
        type: "Heading",
        props: { id: "intro", text: "My work", align: "left", size: "large", mobileSize: "small" },
      },
      {
        type: "Text",
        props: {
          id: "text",
          text: '<script>alert("x")</script>',
          align: "left",
          size: "medium",
          mobileSize: "small",
        },
      },
    ],
  };
  const html = renderToStaticMarkup(<ProfileView profile={{ ...emptyProfile, website }} />);
  expect(html.match(/<h1/g)).toHaveLength(1);
  expect(html).toContain("My work");
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain("<script>");
  expect(html).toContain("Make your own space");
});
it("uses the supplied editor canvas content without recursively rendering the website again", () => {
  const website: WebsiteDocument = {
    ...emptyWebsite,
    content: [
      {
        type: "Heading",
        props: {
          id: "saved",
          text: "Saved content",
          align: "left",
          size: "large",
          mobileSize: "small",
        },
      },
    ],
  };
  const html = renderToStaticMarkup(
    <ProfileView
      profile={{ ...emptyProfile, website }}
      websiteContent={<div>Editor canvas children</div>}
    />,
  );
  expect(html).toContain("Editor canvas children");
  expect(html).not.toContain("Saved content");
});
