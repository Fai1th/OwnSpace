import { emptyProfile, type Profile } from "./profile";

// Fictional demonstration websites, never customer claims. Rendered by the public website renderer.
type Item = { title: string; text: string; url: string; image: string };
const item = (title: string, text = "", url = "", image = ""): Item => ({
  title,
  text,
  url,
  image,
});
const defaults = {
  title: "",
  text: "",
  label: "",
  url: "",
  image: "",
  items: [] as Item[],
  align: "left" as const,
  variant: "plain" as const,
  columns: 2 as const,
  anchor: "",
  date: "",
  value: 50,
  email: "",
};
type Props = Omit<typeof defaults, "align" | "variant" | "columns"> & {
  align: "left" | "center" | "right";
  variant: "plain" | "soft" | "outline";
  columns: 1 | 2 | 3 | 4;
};
function block<T extends string>(type: T, id: string, props: Partial<Props> = {}) {
  return { type, props: { ...defaults, ...props, id } };
}
const site = (pattern: "none" | "grid" | "dots" | "lines" = "none") => ({
  mode: "website" as const,
  backgroundColor: "#171717",
  foreground: "#fbfcfd",
  backgroundImage: "",
  pattern,
  width: "standard" as const,
});
export const websiteExamples: Profile[] = [
  {
    ...emptyProfile,
    handle: "jules",
    displayName: "Jules Rivera",
    site: site(),
    website: {
      version: 1,
      root: { props: {} },
      content: [
        block("SiteNav", "j-nav", {
          title: "Jules Rivera",
          items: [
            item("Work", "", "#work"),
            item("About", "", "#about"),
            item("Contact", "", "#contact"),
          ],
        }),
        block("SplitHero", "j-hero", {
          title: "Design for everyday use.",
          text: "Independent design across identities, websites and digital products.",
          label: "Selected work",
          url: "#work",
          image: "/art/still-life.svg",
        }),
        block("ProjectGrid", "j-work", {
          title: "Selected work",
          anchor: "work",
          items: [
            item(
              "Objects in balance",
              "A study in form and composition.",
              "",
              "/art/still-life.svg",
            ),
            item("Out of office", "A visual identity for time outdoors.", "", "/art/mountain.svg"),
          ],
        }),
        block("Spotlight", "j-about", {
          title: "A little about my practice.",
          text: "I work with small teams to make clear, useful things. This example shows how a portfolio can combine projects, images and a short introduction.",
          anchor: "about",
          variant: "soft",
        }),
        block("Contact", "j-contact", {
          title: "Have a project in mind?",
          text: "Tell me what you are working on.",
          label: "Get in touch",
          email: "hello@example.com",
          anchor: "contact",
        }),
        block("SiteFooter", "j-footer", {
          title: "Jules Rivera",
          text: "An example portfolio made with Ownspace.",
        }),
      ],
    },
  },
  {
    ...emptyProfile,
    handle: "kai",
    displayName: "Kai Studio",
    site: site("lines"),
    website: {
      version: 1,
      root: { props: {} },
      content: [
        block("SiteNav", "k-nav", {
          title: "Kai Studio",
          items: [item("Services", "", "#services"), item("Questions", "", "#questions")],
        }),
        block("Hero", "k-hero", {
          title: "Sound, made together.",
          text: "An independent studio for music, recording and the ideas in between.",
          image: "/art/orbit.svg",
          label: "Explore the studio",
          url: "#services",
        }),
        block("Cards", "k-services", {
          title: "Time in the studio",
          anchor: "services",
          variant: "soft",
          items: [
            item("Recording", "Space to develop a new sound."),
            item("Mixing", "Bring the details into focus."),
            item("Production", "Build an idea into a finished track."),
          ],
          columns: 3,
        }),
        block("Accordion", "k-questions", {
          title: "Before a session",
          anchor: "questions",
          items: [
            item(
              "What should I bring?",
              "Bring your ideas, demos and any instruments you want to use. This is example content that can be edited in the builder.",
            ),
            item(
              "Can we work remotely?",
              "Use this section to explain how your studio works and what a client can expect.",
            ),
          ],
        }),
        block("CallToAction", "k-contact", {
          title: "Tell us what you are making.",
          text: "Start a conversation about your next session.",
          label: "Contact the studio",
          url: "https://example.com/contact",
          variant: "outline",
        }),
        block("SiteFooter", "k-footer", {
          title: "Kai Studio",
          text: "An example studio website made with Ownspace.",
        }),
      ],
    },
  },
  {
    ...emptyProfile,
    handle: "sam",
    displayName: "Sam Chen",
    site: site("grid"),
    website: {
      version: 1,
      root: { props: {} },
      content: [
        block("SiteNav", "s-nav", {
          title: "Sam Chen",
          items: [item("Projects", "", "#projects"), item("Notes", "", "#notes")],
        }),
        block("Hero", "s-hero", {
          title: "Small tools for useful things.",
          text: "A place for software projects, experiments and notes from the build.",
          label: "Explore projects",
          url: "#projects",
        }),
        block("ProjectGrid", "s-projects", {
          title: "Recent projects",
          anchor: "projects",
          items: [
            item(
              "Orbit",
              "An experiment in motion and interface design.",
              "https://example.com",
              "/art/orbit.svg",
            ),
            item(
              "Open sky",
              "A simple place to keep field notes.",
              "https://example.com",
              "/art/sky.svg",
            ),
          ],
        }),
        block("Tabs", "s-notes", {
          title: "Project notes",
          anchor: "notes",
          items: [
            item("Overview", "Explain the problem your project solves, and who it is for."),
            item(
              "How it works",
              "Share the details behind the project, the tools you used and what you learned.",
            ),
          ],
        }),
        block("CodeBlock", "s-code", {
          title: "A small example",
          text: 'export function hello(name) {\n  return "Hello, " + name;\n}',
        }),
        block("SiteFooter", "s-footer", {
          title: "Sam Chen",
          text: "An example project website made with Ownspace.",
        }),
      ],
    },
  },
  {
    ...emptyProfile,
    handle: "noor",
    displayName: "Noor Ellis",
    site: site(),
    website: {
      version: 1,
      root: { props: {} },
      content: [
        block("SiteNav", "n-nav", {
          title: "Noor Ellis",
          items: [item("Collection", "", "#collection"), item("Journal", "", "#journal")],
        }),
        block("SplitHero", "n-hero", {
          title: "Light, shape and the spaces between.",
          text: "A visual journal of places, objects and small observations.",
          image: "/art/mountain.svg",
          label: "View collection",
          url: "#collection",
        }),
        block("Gallery", "n-gallery", {
          title: "An ongoing collection",
          anchor: "collection",
          items: [
            item("Still life", "", "", "/art/still-life.svg"),
            item("Open sky", "", "", "/art/sky.svg"),
            item("Outside", "", "", "/art/mountain.svg"),
            item("In orbit", "", "", "/art/orbit.svg"),
          ],
          columns: 2,
        }),
        block("Spotlight", "n-journal", {
          title: "Room to look a little longer.",
          text: "Use a journal section for the context behind your images, a process note or a new collection.",
          anchor: "journal",
          variant: "soft",
        }),
        block("Contact", "n-contact", {
          title: "For prints and projects.",
          text: "A simple contact section for enquiries.",
          email: "hello@example.com",
          label: "Get in touch",
        }),
        block("SiteFooter", "n-footer", {
          title: "Noor Ellis",
          text: "An example visual journal made with Ownspace.",
        }),
      ],
    },
  },
];
