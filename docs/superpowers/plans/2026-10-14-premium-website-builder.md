# Premium website builder implementation plan

**Goal:** Replace the profile-first positioning with a full-width website canvas, reduce Free, and make a substantial researched React element collection and custom backgrounds Premium.

**Architecture:** Keep Clerk, Postgres, versioned private/published snapshots and the existing legal/consent gates. Preserve existing profile documents; new sites use an optional site-settings object and no forced profile header. Extend bounded trusted JSON with a Premium element catalog. Enforce plans in the repository transaction and public renderer, never just the drawer. Premium React/Vite export contains only the chosen page and explicit renderer files, no private account/service code.

**Design read:** Consumer website builder, charcoal grey, one lime accent, restrained Manrope headings and useful copy. DESIGN_VARIANCE=5, MOTION_INTENSITY=3, VISUAL_DENSITY=4. Taste applies to marketing surfaces; existing Chakra product controls remain. Native Radix primitives are unstyled interactive website elements, not a second product design system.

**Authorization:** User explicitly requests implementation, grey restoration, reduced Free value and Premium-only internet component library. Optional wording clarification about code editing was asked; full canvas/components are useful independently.

## Boundaries

- Project code/dependencies/cache/build/screenshots on D:. No production credentials or fabricated customer claims.
- Sources must permit bundling/export/resale. React Bits currently restricts component resale/bundling, so it is excluded. Use MIT Radix primitives, Embla Carousel, Motion and Prism; keep notices and source links.
- Free: one site, six basic blocks, three links across legacy and website content, one content image, fixed neutral appearance and branding. Premium: up to40 bounded blocks, all advanced elements, custom background/pattern/width/colors, source export.
- Existing private content is retained until an explicit save. New over-limit saves explain the limit instead of silently discarding work. Revoked Premium cannot continue publishing/rendering advanced elements.
- URL/image/JSON safety, age/Terms receipts, billing webhook entitlements, ownership, optimistic versions and cookie rejection remain authoritative.

## Tasks

- [x] Research official React-library APIs/licenses, record selection and exclusions.
- [x] Implement typed Premium catalog, trusted interactive renderer and Puck field configuration; test schema and actual widgets.
- [x] Add site canvas/settings, Premium drawer gating and locked catalog previews, background controls, starter layouts; adapt saving/recovery/preview.
- [x] Centralize limits and enforce in repository save/publish/public rendering; test forged direct API requests, refund revocation and legacy records.
- [x] Ship Premium React/Vite source ZIP export with allowlisted files and all dependency notices; verify extracted project typecheck/build.
- [x] Redesign landing/pricing/examples and restore grey throughout app; no generic slogans, invented endorsements, renamed auth/legal routes.
- [x] Run types, full regressions, build, desktop/mobile real Clerk flows and paid/free editor checks, a11y and independent review.

Release handoff: push the verified changes to the authorized repository and record the exact commit and Vercel result in the chat.

## Review focus

- Restoring a paid draft after a refund must not leak advanced elements through save, publish, cached snapshots or export.
- Drawer locks are informational; forged content and background settings must be rejected server-side.
- A blank full-site canvas must remain editable, saveable and accessible without legacy profile header assumptions.
- Interactive widgets must work outside the editor and remain selectable inside it; reduced motion and mobile overflow matter.
- Source export must contain no env files/account records, build independently, preserve notices and escape user content without executable injection.
