# Ownspace product and implementation plan

User-authorized full build, October 13, 2026. Local project and dependencies: D:/Vibecoding/Projects/Ownspace.

## October 14 website-builder update

The active specification is `docs/superpowers/plans/2026-10-14-premium-website-builder.md`. The charcoal canvas (#202020), quieter copy, full website layout and Premium element library supersede the original personal-page emphasis below. Historical milestones remain for context.

## Design

Consumer personal-site SaaS. October 14 update: the user's house-shaped Ownspace logo supersedes the prior two-slash mark; dashboard theme work waits for the user's mockup (docs/DASHBOARD-NOTES.md). #BEDD76 accent, #202955 canvas, #FBFCFD text, #2A312B muted surfaces. Manrope type, asymmetric product-led homepage, interactive CSS 3D phone displaying the real profile renderer, example gallery without fabricated customer statistics. Motion communicates selection and feedback; respect reduced motion. Buttons 12px, panels 20px, phone physical rounded frame.
FutureUI reference is inspiration for an independently implemented phone, not copied premium code. Official Chakra/Saas UI preset for accessible product controls; no paid components.

## Product scope

One profile per account, editable bio, avatar, links, image cards, four styles (night, aero, desktop, gallery), order and visibility, local draft preview without keys, protected server persistence with Clerk, explicit publish/unpublish, unique handles and separate published snapshot. GitHub OAuth login via Clerk, optional user-owned Composio connection for public-repository card import. Premium one-time customization via Stripe Checkout with verified idempotent webhooks; configurable pricing. Data export, profile deletion, account deletion with provider cleanup. Link safety and bounded payloads.

## Storage and configuration

Postgres in production (DATABASE_URL), embedded Postgres for development and integration tests only. Automatic idempotent schema setup; setup command validates operator details, secrets and services without logging secrets. No hardcoded service credentials, domains, business addresses, billing identifiers or real customer data. All environment requirements in .env.example and README.

## Privacy and launch limits

Equal accept/reject controls; granular analytics/marketing consent default off, persistent versioned consent, reopen settings, honor GPC, no optional script before consent, revoke optional scripts and cookies. Necessary auth separate. Only approved tracking providers with configured IDs. Config-driven legal pages with actual operator/contact/jurisdiction; production setup blocked if omitted. Published profiles contain no scripts, iframes or raw HTML. Report-abuse form and owner deletion. No unsupported global legal-compliance guarantee.

## Tasks and verification

1. Foundation/config + validation + consent domain tests (unsafe URLs, invalid handles, payload bounds, expiry, GPC).
2. Repository and APIs (ownership, duplicate handles, snapshots, unpublish, race conflicts, webhook idempotency and refund revocation).
3. Marketing + responsive phone + gallery + pricing + consent + legal.
4. Editor/dashboard + persistence/preview + integrations + settings/export/delete + billing.
5. Tests, production build, browser desktop/mobile, accessibility smoke tests, fix issues, fresh security review.
   Live Clerk, Stripe and Composio verification requires user's credentials and provider dashboard configuration; report separately.
