# Premium website element catalog

The Premium library contains 30 addable website sections. All are Premium leaves; the application is responsible for enforcing entitlement when saving, publishing and exporting. The renderer itself has no authentication, environment variables, network SDKs or Next.js imports.

## Catalog

| Group       | Elements                                                                                                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structure   | Site navigation, Statement hero, Split hero, Call to action, Section divider, Contact section, Site footer, Announcement bar                                                                               |
| Content     | Feature grid, Content cards, Project showcase, Pricing plans, Numbers and facts, Timeline, Quote / testimonial, Highlight badge, Checklist, Syntax highlighted code, Process steps, Social link collection |
| Media       | Image gallery, Logo collection                                                                                                                                                                             |
| Interactive | Image carousel, FAQ accordion, Tabbed content, Before / after, Event countdown, Progress indicator                                                                                                         |
| Motion      | Moving text ribbon, Animated spotlight                                                                                                                                                                     |

Every element has an original Ownspace layout and original editable copy. No purchased template, customer testimonial, customer count, brand logo, or claimed performance metric is supplied. Stats and prices explicitly ask the owner to replace the example. Quote and logo controls call attention to permission to publish the owner's supplied material. Default art is the repository's existing local /art collection.

## Actual upstream components and sources

| Function                        | Implementation used                                      | Source / license                                                                                   |
| ------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| FAQ expansion                   | Radix Accordion Root / Item / Header / Trigger / Content | [Radix Primitives](https://github.com/radix-ui/primitives), MIT, WorkOS 2022                       |
| Keyboard accessible tabs        | Radix Tabs Root / List / Trigger / Content               | [Radix Primitives](https://github.com/radix-ui/primitives), MIT, WorkOS 2022                       |
| Progress semantics              | Radix Progress Root / Indicator                          | [Radix Primitives](https://github.com/radix-ui/primitives), MIT, WorkOS 2022                       |
| Drag / swipe carousel           | embla-carousel-react useEmblaCarousel                    | [Embla Carousel](https://github.com/davidjerleke/embla-carousel), MIT, David Jerleke               |
| Syntax highlighting             | prism-react-renderer Highlight with packaged theme       | [Prism React Renderer](https://github.com/FormidableLabs/prism-react-renderer), MIT, Nearform 2018 |
| Ambient light and moving ribbon | motion/react motion.div and useReducedMotion             | [Motion](https://github.com/motiondivision/motion), MIT, Motion B.V. 2024                          |

The layout, controls, CSS, gallery dialog, comparison slider, countdown and content composition are original application code. Upstream packages are imported through their public React APIs; no upstream demo markup or CSS was copied. ReactBits components are deliberately excluded because its current MIT + Commons Clause terms restrict component resale. No claim is made that this catalog contains ReactBits code or that those terms permit selling its components.

License text is retained in [PREMIUM-LICENSES.md](./PREMIUM-LICENSES.md). When redistributing source or bundled substantial portions, preserve applicable notices and dependency license files. Package manifests and lockfiles retain the actual dependency versions; source URLs identify origins, not a claim that the latest branch is installed.

## Renderer / export boundary

Public entry point: components/premium-elements/index.tsx exports PremiumElementView({ element, interactive = true }). It imports shared.tsx, content.tsx, media.tsx, interactive.tsx, motion.tsx and premium-elements.css from that directory. Pure types / catalog are in lib/premium-elements.ts, and URL / raster image validation is in lib/site-safety.ts. React and all runtime libraries in the table above must be present in a standalone React export. zod is required if the schema/catalog module is imported at runtime. The Puck helper is not part of the public rendering bundle.

The interactive=false path uses selectable static markup for links, navigation, tabs, accordions, carousels, image viewers, copy buttons and the comparison input. Countdown placeholders do not tick in editor mode. Public mode uses actual accessible primitives and controls. No raw HTML injection or HTML/embed editing API exists.

Section anchors use the explicit validated anchor, then its unchanged safe component ID. Actions accept only blank, same-page anchors, or public HTTPS destinations through site-safety. Images accept approved repository art or bounded raster data through the same pure validation helper. The schema is strict at both element and props levels and requires every canonical field. It bounds arrays to eight, strings, images, percentages, dates and email. All 30 default objects pass the schema.

## Controls and design behavior

createPremiumComponents in components/website-editor-premium.tsx supplies all 30 Puck component configs, with readable Premium labels, complete default props and controls tailored to each element. Item controls expose the applicable title, description, link and upload fields and preserve the canonical item object. Image upload uses the application's existing optimizeImage implementation. Images remain portable data rather than a reference to a private upload service.

All CSS is scoped under premium-* classes. Section colors inherit --site-accent, --site-foreground and --site-background. Grids reflow to two columns and then one on smaller viewports. Navigation includes a mobile menu; galleries use the native modal dialog; headings follow section semantics with Hero as h1 and regular titled sections as h2. Motion includes a pause control and honors prefers-reduced-motion. Native range inputs provide keyboard image comparison. Carousel controls have accessible names, disabled end states and a polite position announcement. Countdown ticks use timer semantics without repeatedly interrupting screen readers.

## Verification

Focused tests cover all canonical defaults, unsafe URLs, blocked image types, unknown fields, missing fields, size/count limits, ISO dates, escaped text, safe anchors, static editor previews and tailored Puck controls. The interaction suite exercises the actual Radix accordion, actual Radix tabs, actual Embla carousel, comparison range, mobile menu and actual Radix progress semantics. Browser geometry / observer APIs are supplied in jsdom; the component libraries are not mocked.
