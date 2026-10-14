# Dashboard direction — October 14, 2026

Current milestone: complete Clerk development authentication first. Wait for the user's dashboard mockup before implementing the replacement dashboard or its theme settings.

## Approved brand assets

The newly supplied house-shaped Ownspace identity replaces the prior two-slash mark. Preserve the supplied originals under public/brand:

- logo-transparent.png: transparent full lockup for the current interface.
- mark-transparent.png: transparent symbol for compact placements and the favicon.
- logo-dark.png: full lockup on the supplied grey background.
- logo-light.png and mark-light.png: light-preset references.
- logo-midnight.png: midnight-preset reference.

Logo framing is handled by SVG viewBox in the interface; supplied raster originals have not been edited.

## Requested dashboard settings

- Show dashboard settings after sign-in.
- Light: white full-logo reference and a light dashboard palette.
- Midnight: the blue-background logo reference and a midnight dashboard palette.
- Dark: the current site's background color/palette, with the grey-background logo as appropriate.
- This is the dashboard's interface color scheme, distinct from a customer's published personal-page theme.
- Implement the switcher with the forthcoming dashboard mockup. This milestone only preserves these decisions and uses the new logo in the existing interface.

## Authentication milestone

A separate Ownspace development app was created in the user's existing Clerk account. Term is untouched. Credentials live only in the ignored .env.local file on D:. Email/password with email verification, Google and GitHub are enabled in development.

Provider defaults route sign-in/sign-up to the local pages, then /studio, and sign-out to /. Signed-in navigation exposes Dashboard and the account menu. Keep localhost consistent for browser URLs and local server binding; mixing it with a loopback IP caused a reproducible Next.js/Clerk rewrite timeout.

Before a public launch: configure the production Clerk instance/domain and production social OAuth credentials; register the signed user.deleted webhook endpoint and signing secret; complete production storage and legal/operator settings. The local development account flow is verified; production deployment and external OAuth consent are separate checks.
