import { z } from "zod";
import { siteLink, websiteImage } from "./site-safety";

export const premiumElementTypes = [
  "SiteNav",
  "Hero",
  "SplitHero",
  "FeatureGrid",
  "Cards",
  "ProjectGrid",
  "Gallery",
  "Carousel",
  "Accordion",
  "Tabs",
  "PricingTable",
  "CallToAction",
  "Stats",
  "Timeline",
  "Quote",
  "LogoCloud",
  "Divider",
  "Badge",
  "Checklist",
  "ImageCompare",
  "CodeBlock",
  "Countdown",
  "Contact",
  "SiteFooter",
  "Marquee",
  "Spotlight",
  "Announcement",
  "Steps",
  "SocialLinks",
  "Progress",
] as const;
const link = z.string().max(2048).refine(siteLink, "Use a public HTTPS URL or #section anchor.");
const image = z.string().max(350000).refine(websiteImage, "Upload a PNG, JPEG or WebP image.");
export const premiumElementPropsSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .max(80)
      .regex(/^[a-zA-Z0-9_-]+$/)
      .refine((id) => id !== "root"),
    title: z.string().max(160),
    text: z.string().max(4000),
    label: z.string().max(100),
    url: link,
    image,
    items: z
      .array(
        z
          .object({ title: z.string().max(120), text: z.string().max(1000), url: link, image })
          .strict(),
      )
      .max(8),
    align: z.enum(["left", "center", "right"]),
    variant: z.enum(["plain", "soft", "outline"]),
    columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    anchor: z
      .string()
      .max(80)
      .refine((value) => value === "" || /^[a-zA-Z][a-zA-Z0-9-]*$/.test(value)),
    date: z
      .string()
      .max(40)
      .refine(
        (value) =>
          value === "" ||
          z.iso.date().safeParse(value).success ||
          z.iso.datetime({ offset: true }).safeParse(value).success,
        "Enter an ISO date or date and time, including timezone.",
      ),
    value: z.number().min(0).max(100),
    email: z
      .string()
      .max(254)
      .refine((value) => value === "" || z.email().safeParse(value).success),
  })
  .strict();
export const premiumElementSchema = z
  .object({ type: z.enum(premiumElementTypes), props: premiumElementPropsSchema })
  .strict();
export type PremiumElement = z.infer<typeof premiumElementSchema>;
export type PremiumElementProps = z.infer<typeof premiumElementPropsSchema>;
export type PremiumElementType = PremiumElement["type"];
export type PremiumCategory = "Structure" | "Content" | "Media" | "Interactive" | "Motion";
export type PremiumCatalogEntry = {
  type: PremiumElementType;
  label: string;
  category: PremiumCategory;
  description: string;
  source: string;
  defaults: Omit<PremiumElementProps, "id">;
};
const base: Omit<PremiumElementProps, "id"> = {
  title: "",
  text: "",
  label: "",
  url: "",
  image: "",
  items: [],
  align: "left",
  variant: "plain",
  columns: 3,
  anchor: "",
  date: "",
  value: 50,
  email: "",
};
const item = (title: string, text = "", url = "", image = "") => ({ title, text, url, image });
const own = "Original Ownspace composition";
function entry(
  type: PremiumElementType,
  label: string,
  category: PremiumCategory,
  description: string,
  defaults: Partial<Omit<PremiumElementProps, "id">>,
  source = own,
): PremiumCatalogEntry {
  return { type, label, category, description, source, defaults: { ...base, ...defaults } };
}
export const premiumCatalog: PremiumCatalogEntry[] = [
  entry("SiteNav", "Site navigation", "Structure", "Brand and section links, with a mobile menu.", {
    title: "Your studio",
    label: "Let's talk",
    url: "#contact",
    items: [
      item("Work", "", "#work"),
      item("About", "", "#about"),
      item("Contact", "", "#contact"),
    ],
  }),
  entry(
    "Hero",
    "Statement hero",
    "Structure",
    "A generous opening statement with an optional image and action.",
    {
      title: "Introduce your work.",
      text: "Describe what you do and who it is for.",
      label: "Explore my work",
      url: "#work",
      align: "center",
    },
  ),
  entry("SplitHero", "Split hero", "Structure", "Opening copy beside a large art panel.", {
    title: "A title for your project.",
    text: "Describe your project, service or idea.",
    image: "/art/still-life.svg",
    label: "See the work",
    url: "#work",
  }),
  entry(
    "FeatureGrid",
    "Feature grid",
    "Content",
    "Numbered benefits with room for useful detail.",
    {
      title: "What you offer",
      items: [
        item("Your first feature", "Explain the benefit in your own words."),
        item("Your second feature", "Share what makes your approach useful."),
        item("Your third feature", "Help visitors understand the difference."),
      ],
    },
  ),
  entry("Cards", "Content cards", "Content", "Image, title, copy and destination for each card.", {
    title: "Articles and updates",
    items: [
      item("First story", "Add your own description.", "", "/art/sky.svg"),
      item("Second story", "Add your own description.", "", "/art/orbit.svg"),
      item("Third story", "Add your own description.", "", "/art/mountain.svg"),
    ],
  }),
  entry(
    "ProjectGrid",
    "Project showcase",
    "Content",
    "An editorial grid for work, case studies and collections.",
    {
      title: "Selected work",
      anchor: "work",
      columns: 2,
      items: [
        item("Project name", "Add the role, year, and context.", "", "/art/still-life.svg"),
        item("Another project", "Explain what you created.", "", "/art/mountain.svg"),
      ],
    },
  ),
  entry(
    "Gallery",
    "Image gallery",
    "Media",
    "A responsive image grid with optional full image viewer.",
    {
      title: "Image gallery",
      columns: 3,
      items: [
        item("Describe this image", "", "", "/art/sky.svg"),
        item("Describe this image", "", "", "/art/still-life.svg"),
        item("Describe this image", "", "", "/art/mountain.svg"),
      ],
    },
  ),
  entry(
    "Carousel",
    "Image carousel",
    "Interactive",
    "Swipeable image stories with previous and next controls.",
    {
      title: "Featured images",
      items: [
        item("First slide", "Your caption here.", "", "/art/sky.svg"),
        item("Second slide", "Your caption here.", "", "/art/mountain.svg"),
        item("Third slide", "Your caption here.", "", "/art/still-life.svg"),
      ],
    },
    "Embla Carousel · MIT · https://github.com/davidjerleke/embla-carousel",
  ),
  entry(
    "Accordion",
    "FAQ accordion",
    "Interactive",
    "Accessible expandable questions powered by Radix.",
    {
      title: "Questions and answers",
      items: [
        item("What do you offer?", "Replace this example with your own answer."),
        item("How do we get started?", "Explain the first step for working with you."),
        item("Where can I learn more?", "Point visitors toward the right place."),
      ],
    },
    "Radix Accordion · MIT · https://github.com/radix-ui/primitives",
  ),
  entry(
    "Tabs",
    "Tabbed content",
    "Interactive",
    "Keyboard accessible tabs for organizing related ideas.",
    {
      title: "Project details",
      items: [
        item("Overview", "Introduce your idea."),
        item("Process", "Describe how you work."),
        item("Details", "Add the specifics visitors need."),
      ],
    },
    "Radix Tabs · MIT · https://github.com/radix-ui/primitives",
  ),
  entry(
    "PricingTable",
    "Pricing plans",
    "Content",
    "Editable plan labels, prices, details and action links.",
    {
      title: "Your offer, clearly explained",
      text: "Example plans below. Replace all prices and details before publishing.",
      label: "Choose this plan",
      items: [
        item("Plan name", "Your price\nYour included feature\nYour other feature"),
        item("Another plan", "Your price\nYour included feature\nYour other feature"),
      ],
    },
  ),
  entry("CallToAction", "Call to action", "Structure", "A focused invitation and destination.", {
    title: "Get in touch",
    text: "Tell visitors what comes next.",
    label: "Start a conversation",
    url: "#contact",
    variant: "soft",
    align: "center",
  }),
  entry("Stats", "Numbers and facts", "Content", "Your verified numbers with explanatory labels.", {
    title: "Key figures",
    text: "Editable examples. Add only numbers you can support.",
    items: [
      item("Your number", "Describe what this measures."),
      item("Your number", "Describe what this measures."),
      item("Your number", "Describe what this measures."),
    ],
  }),
  entry("Timeline", "Timeline", "Content", "A vertical sequence of milestones and moments.", {
    title: "Timeline",
    items: [
      item("Year or milestone", "Describe what happened."),
      item("The next chapter", "Add an important moment."),
      item("Today", "Share what comes next."),
    ],
  }),
  entry(
    "Quote",
    "Quote / testimonial",
    "Content",
    "A large quotation with source and optional portrait.",
    {
      text: "Add a quotation you have permission to share.",
      title: "Author name",
      label: "Role or source",
      align: "center",
    },
  ),
  entry(
    "LogoCloud",
    "Logo collection",
    "Media",
    "Uploaded logos or clearly labeled names in a flexible row.",
    {
      title: "Your collaborators",
      text: "Add logos only when you have permission to use them.",
      items: [item("Your logo"), item("Your logo"), item("Your logo"), item("Your logo")],
    },
  ),
  entry("Divider", "Section divider", "Structure", "A quiet line and optional chapter label.", {
    label: "The next chapter",
  }),
  entry(
    "Badge",
    "Highlight badge",
    "Content",
    "A compact label for a status, topic or announcement.",
    { label: "Your announcement", variant: "soft" },
  ),
  entry("Checklist", "Checklist", "Content", "A scannable list of inclusions or useful facts.", {
    title: "What is included",
    items: [
      item("Your first item", "Add helpful context if needed."),
      item("Your second item", ""),
      item("Your third item", ""),
    ],
  }),
  entry(
    "ImageCompare",
    "Before / after",
    "Interactive",
    "An accessible slider for comparing two uploaded images.",
    {
      title: "See the difference",
      image: "/art/sky.svg",
      label: "Before",
      items: [item("After", "", "", "/art/mountain.svg")],
      value: 50,
    },
  ),
  entry(
    "CodeBlock",
    "Syntax highlighted code",
    "Content",
    "Readable code highlighted by Prism, with an optional copy button.",
    {
      title: "Code example",
      label: "javascript",
      text: '// Replace this editable example\nconst idea = "Make it yours";\nconsole.log(idea);',
    },
    "Prism React Renderer · MIT · https://github.com/FormidableLabs/prism-react-renderer",
  ),
  entry(
    "Countdown",
    "Event countdown",
    "Interactive",
    "Live days, hours, minutes and seconds until your chosen date.",
    {
      title: "Your event",
      text: "Choose your event date in the editor.",
      label: "The wait is over",
    },
  ),
  entry(
    "Contact",
    "Contact section",
    "Structure",
    "A contact invitation with a verified email link.",
    {
      title: "Let's make a connection",
      text: "Add your email in the editor so visitors can get in touch.",
      label: "Say hello",
      anchor: "contact",
    },
  ),
  entry("SiteFooter", "Site footer", "Structure", "Closing brand, short note and useful links.", {
    title: "Your studio",
    text: "A little note to end on.",
    items: [item("Back to top", "", "#top"), item("Contact", "", "#contact")],
  }),
  entry(
    "Marquee",
    "Moving text ribbon",
    "Motion",
    "A pausable text ribbon with reduced motion support.",
    { items: [item("Your idea"), item("Your craft"), item("Your next chapter")], variant: "soft" },
    "Original Ownspace composition · Motion · MIT · https://github.com/motiondivision/motion",
  ),
  entry(
    "Spotlight",
    "Animated spotlight",
    "Motion",
    "An ambient animated highlight behind your message.",
    {
      title: "Put your next idea in the spotlight.",
      text: "A quiet moment of motion for something that deserves attention.",
      label: "Discover more",
      url: "#work",
      align: "center",
      variant: "soft",
    },
    "Original Ownspace composition · Motion · MIT · https://github.com/motiondivision/motion",
  ),
  entry(
    "Announcement",
    "Announcement bar",
    "Structure",
    "A compact update with an optional action.",
    {
      title: "Your latest update",
      text: "Share a launch, a new project, or a useful note.",
      label: "Read more",
      url: "#work",
      variant: "soft",
    },
  ),
  entry(
    "Steps",
    "Process steps",
    "Content",
    "A clear numbered sequence for a process or next steps.",
    {
      title: "How it comes together",
      items: [
        item("Start here", "Describe the first step."),
        item("Build on it", "Explain the next step."),
        item("Make it happen", "Describe the outcome."),
      ],
    },
  ),
  entry(
    "SocialLinks",
    "Social link collection",
    "Content",
    "Your social profiles or other public destinations.",
    {
      title: "Elsewhere on the internet",
      items: [
        item("Your profile", "Add your public HTTPS profile URL in the editor."),
        item("Your newsletter", "Add your public HTTPS subscription URL in the editor."),
      ],
    },
  ),
  entry(
    "Progress",
    "Progress indicator",
    "Interactive",
    "An accessible, explicitly labeled 0–100 progress bar.",
    {
      title: "Your project progress",
      text: "Editable example. Set this to your actual progress.",
      value: 50,
    },
    "Radix Progress · MIT · https://github.com/radix-ui/primitives",
  ),
];
