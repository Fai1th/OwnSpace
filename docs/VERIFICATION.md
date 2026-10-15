# Verification ledger

Verified October 14, 2026. Latest milestone: Premium website builder, full canvas and React source export.

## Legal center, editor and deployment: October 14

- Added original product-specific legal material informed by TermsFeed/Termly public guidance: legal hub, expanded Terms/Privacy/Cookies, acceptable use, payments/refunds, copyright, provider register and privacy choices. Sources and undecided launch facts are recorded in `docs/LEGAL-RESEARCH.md`. No proprietary generator output or legal certification is claimed.
- Business identity, address, jurisdiction, domain, support and actual infrastructure/processing details remain undecided/configurable. Policies visibly remain drafts. Real provider contracts, retention operations, cookie inventory, sales markets and applicable consumer procedures still need confirmation before public operation.
- Versioned Terms/eligibility receipts are owner-scoped, idempotent, exported with account data and removed on account deletion. Publication and checkout require current explicit acceptance, separate from optional tracking consent. Review reproduced a concurrent-create agreement bypass; all publication attempts now enforce acceptance unconditionally.
- Added authenticated `/dashboard` and Puck MIT `/editor` with trusted Heading/Text/Link/Image/Spacer/Section blocks, nested slots, responsive canvas/properties, native layers and history, preview, JSON export, versioned saves and explicit publish/unpublish. Existing profiles and entitlement rules remain compatible. No AGPL code/assets were copied; see `docs/EDITOR-INTEGRATION.md` and `THIRD_PARTY_NOTICES.md`.
- Fixed saved/unsaved status timing in profile tools and structural equality in the Puck adapter. In-flight changes survive save acknowledgments. Bounded account-scoped tab memory recovers unsaved fields/blocks across Next.js Back navigation; original optimistic versions still conflict with remote updates. Deleted saved pages are not resurrected.
- Browser audit found Puck loader/zoom/iframe labels and nested draggable-parent semantics needed repair. Scoped adapters preserve actual native elements, keyboard/pointer listeners, child controls and DND instructions. The final real editor axe audit has no serious/critical WCAG A/AA findings. Added mobile-menu sign-in for returning visitors.
- **103 unit/component/database/accessibility tests passed across 27 files.** Formatting and the compiled production preview build (including TypeScript) passed after all code fixes.
- **12 desktop/mobile legal/consent browser tests passed**: all policy routes, responsive layout, real export/settings links, rejection/withdrawal persistence, blocked-localStorage fallback and cross-tab withdrawal.
- **Ten real Clerk lifecycle checkpoints passed on the final compiled app**: signed-out route/API boundary; synthetic signup/email verification and dashboard redirect; explicit agreement gating with optional cookies rejected; real Puck drag/nesting, properties, undo/redo, Back recovery, account save/reload, mobile preview, local publish/unpublish; logout/API revocation; mobile sign-in layout; existing password login/draft restoration; signed-in navigation; mobile profile tools; actual account-deletion UI returning to signed-out mobile navigation. Temporary Clerk identities were deleted. Orphaned local synthetic test pages from earlier failed checks were removed only after confirming their test identities no longer existed.
- Investigated actual Vercel logs: previous builds exited in the preflight script before compilation because required service/operator env vars were absent. Build preflight now warns, while strict `npm run validate:production` still fails incomplete configuration. Hosted signup, account APIs, publishing, checkout and public profiles fail closed until configuration is complete; `VERCEL=1` cannot bypass this using the local preview flag.
- Pinned Node24 and made npm caching portable; deployment upload excludes keys, local database, dependencies and browser work artifacts. No secret/env file is tracked.
- **Remote Vercel preview reached READY:** https://own-space-gof26tlmo-fai1ths-projects.vercel.app (deployment `dpl_DnWZQnDnAfp6CZqADQDzNHQhMohh`). Verified with the existing local Vercel development identity, preserving Deployment Protection: legal hub renders with no serious/critical accessibility findings and noindex; unconfigured auth/dashboard/editors show setup; account/export/agreement/publish/checkout return503; public profile returns404; health reports setup; robots disallow indexing; mobile legal page fits; no browser exceptions. This preview preceded the final accessibility/mobile-navigation adapter changes; the final source was separately compiled and browser-verified locally.
- Remaining live-service gaps: Vercel still has no required production configuration. Real hosted Clerk/social callbacks/webhook, Postgres, Stripe payment/refund/dispute delivery and Composio OAuth need configured test/live services. No production credentials, paid services, customer claims, outreach or public account/payment activation were used. A successful build is not a launch-readiness certification.
- Current final-source local preview: http://localhost:3003. All source/dependencies/build/browser artifacts stay on D:. Prior entries below are historical evidence, not current setup instructions.

## Clerk integration and supplied branding: October 14

- Created a separate Ownspace development application in the user's existing Clerk account. Term was not changed. The official CLI linked the Git remote and pulled development keys directly to ignored .env.local on D:.
- CLI init could not recognize the existing nested provider and added a duplicate wrapper. Restored a single configured provider, keeping the existing API authorization boundaries.
- Added built-in /sign-in, /sign-up and /studio fallback redirects, sign-out to /, and signed-in Dashboard/account controls. No secret is bundled or committed.
- Reproduced a Clerk/Next.js local rewrite timeout with an IP-bound server. Local dev/start/preview now bind to localhost; browser URLs and browser test defaults use the same origin.
- Enabled email/password with email verification, Google and GitHub in the development Clerk instance. External Google/GitHub OAuth consent is enabled but was not automated with a real social account.
- Used the user's new house-shaped logo for the existing header/footer/editor and favicon. Preserved all six supplied originals. A browser check found legacy icon CSS shrinking the full wordmark; corrected its responsive dimensions.
- **63 unit/component/database tests passed** across 16 files. TypeScript, formatting and the compiled local preview build passed.
- **Eight real Clerk lifecycle checks passed against the compiled bundle**: signed-out redirect/API rejection; actual signup/test email verification/authenticated save; user-menu logout/API revocation; mobile sign-in/logo/overflow; password login restoring the saved account draft; signed-in navigation; authenticated mobile layout; account/profile deletion.
- Tests used Clerk's official development testing token and synthetic +clerk_test emails; no real verification email was sent. Temporary identities were deleted after each run. No page was published.
- Added guarded npm run test:auth for repeatable local verification. It rejects production keys and non-localhost targets; screenshots/results stay under work/ on D:.
- Clerk doctor confirms the app and development environment are connected. Production instance/domain and signed hosted user.deleted webhook remain for public-launch setup, together with hosted storage and operator/legal configuration.
- New dashboard theme direction is saved in docs/DASHBOARD-NOTES.md. Light, Midnight and Dark dashboard settings await the user's dashboard mockup and are not implemented in this auth milestone.
- Current compiled preview: http://localhost:3003. The overnight automation remains paused.

## Final overnight status: October 13, approximately 9:30 AM Central

- Finished the current check after the user's 9 AM cutoff. No new reproducible issue was found in this final billing/consent pass.
- Final focused checks: **15 tests passed** across four files covering signed dispute webhook handling, Premium/handle restrictions, account entitlements and consent storage.
- Final compiled-server browser checks: **8 passed** at desktop/mobile sizes covering rejection persistence with blocked localStorage, cross-tab withdrawal, granular rejection and Global Privacy Control.
- The latest full local verification at 8:40 AM passed **60 unit/component/database tests**, TypeScript, formatting and compiled build. The current compiled bundle also passed ten editor/deletion/accessibility/API browser checks in that audit.
- Local Git changes are committed. The full product and dependencies remain on D:, with local preview at http://127.0.0.1:3002.
- Overnight automation **ownspace-overnight-bug-checks is PAUSED**, confirmed through the app tool and saved configuration. No recurring overnight runs remain active.
- Live Clerk sign-in, Stripe Checkout/webhooks, Composio OAuth and hosted Postgres still require user credentials and provider dashboard setup. Legal/operator configuration remains required before production. No production credentials, external publishing, outreach or purchases were used.

## Overnight audit: October 13, approximately 8:40 AM Central

- Reproduced a deleted online page returning from an older browser draft on the next editor load. Successful page/account deletion now clears this browser's fallback draft; failed online deletion retains its content.
- Browser cleanup failure is reported accurately after successful online deletion, with instructions to clear this site's browser data rather than claiming every copy was removed.
- Reproduced an imported browser draft being labeled saved before its first account save. Account drafts without a persisted page now remain unsaved and trigger the existing leave-page warning until server saving succeeds.
- Added React component regression coverage for deletion/reload, failed deletion, confirmed account deletion, denied browser cleanup and imported-draft save/leave behavior.
- **60 unit/component/database tests passed** across 15 files. TypeScript, formatting and compiled preview build passed.
- **10 compiled-server desktop/mobile browser checks passed**, including browser-draft deletion/reload, invalid links, unfinished drafts, editing/save/reordering/preview, unauthenticated API boundaries and accessibility.
- Only .env.example exists. Authenticated API responses in component tests are local fixtures; live Clerk/Stripe/Composio/hosted Postgres behavior remains unverified without credentials. No external page was published.
- Compiled local preview remains at http://127.0.0.1:3002. At the first audit after 9 AM Central, finish the current check, issue the final status and pause the automation.

## Overnight audit: October 13, approximately 7:35 AM Central

- Reproduced a temporary authenticated profile-load failure opening an empty editable profile labeled Draft saved. The editor now stays closed behind an accessible error screen with an explicit retry until the saved account page has loaded.
- The failing React component test now passes: no Save or editable profile is exposed after a load error, and retry restores the actual saved profile.
- Added publication error/retry coverage through the real editor: newer edits remain private after a failed publish, and a later retry saves them with the correct version before publishing.
- **55 unit/component/database tests passed** across 15 files. TypeScript, formatting and compiled preview build passed.
- **8 compiled-server desktop/mobile browser checks passed**, covering invalid-link errors, unfinished drafts, save/reload/reordering/preview, blocked unauthenticated publication, API boundaries and accessibility.
- Authenticated load and publication responses in component tests use local boundary fixtures. No live Clerk, Stripe, Composio or hosted Postgres credentials were available or used; no page was published externally.
- Compiled local preview remains at http://127.0.0.1:3002. Hourly audits remain active until the 9 AM Central cutoff.

## Overnight audit: October 13, approximately 7:00 AM Central

- Reproduced and fixed Premium appearing Free when a paid account had no page. Account entitlements now come from purchases independently of page existence; deleting a page retains the account upgrade.
- Checkout returns now use bounded authenticated status checks, then offer a manual retry if confirmation is still pending. The check reads a small private account response and does not replace the draft or its concurrency version.
- Reproduced an older save response undoing a newer verified payment confirmation. Save/publish responses now preserve entitlement observations made since their requests began.
- Added real embedded-Postgres account-boundary tests and React editor tests for paid accounts without pages, delayed confirmation, retry limits, draft preservation and stale save responses.
- **53 unit/component/database tests passed** across 15 files. TypeScript, formatting and compiled preview build passed.
- **8 focused compiled-server browser checks passed** at desktop/mobile sizes, covering checkout-return spoofing, editing/save/reload, API boundaries and accessibility.
- Payment polling is disabled in the keyless demo. A checkout-return query alone never grants Premium; account status requires authentication.
- Only .env.example is present. Provider responses in component tests are local fixtures; live Clerk, Stripe, Composio and hosted-database checks remain dependent on configuration.

## Overnight audit: October 13, approximately 5:45 AM Central

- Reproduced editor data loss through the real React component with a delayed local save response: text typed after Save was clicked was overwritten by the response.
- Save completion now reconciles fields against the submitted snapshot. Later edits remain in the editor and are marked unsaved; server normalization and free-plan restrictions still apply to untouched fields. The saved version advances so the next request can use the correct concurrency token.
- Reproduced paid-upgrade loss when Clerk account deletion failed. Purchase ownership is now retained until Clerk deletion succeeds or the provider confirms the account is already gone. Account-deletion retries remain idempotent.
- Added test-only DOM tools for these component checks. Clerk/provider UI and API responses are mocked only at external boundaries; no authentication bypass or test route was added to the product.
- **46 unit/component/database tests passed** across 13 files. TypeScript, formatting and compiled preview build passed.
- **8 focused compiled-server browser checks passed** at desktop/mobile sizes, covering editing/save/reload, incomplete drafts, API boundaries and accessibility.
- Only .env.example is present. Live Clerk, Stripe, Composio and hosted-database checks remain dependent on configuration; no production credentials were used.

## Overnight audit: October 13, approximately 4:40 AM Central

- Reproduced and fixed cookie choices being forgotten after reload when localStorage is unavailable. The existing first-party consent cookie is now a safe fallback.
- When cookie and localStorage choices differ, the newest valid choice wins; an equal-timestamp disagreement is resolved conservatively toward rejection. Invalid and expired choices remain rejected.
- Reproduced and fixed withdrawal in one tab leaving another tab on its old choices. Storage/BroadcastChannel updates now reapply consent, with focus/visibility fallback and proper listener cleanup.
- Synchronization does not overwrite unsaved checkbox edits when no stored choice changed. An additional browser regression test exposed and verified this case.
- Profile view tracking uses the same stored-choice resolution as the banner. Repeated identical synchronization does not reinitialize tracking scripts.
- **38 unit/database tests passed** across 10 files; TypeScript, formatting and the compiled preview build passed.
- **24 compiled-server browser checks passed** at desktop/mobile sizes, including consent persistence, cross-tab withdrawal, unsaved edits, GPC, editor/save/preview, authentication boundaries, accessibility and responsive pages.
- Optional third-party trackers were not configured during these browser checks; no live provider credentials or accounts were accessed. Their live-service checks remain dependent on user configuration.

## Overnight audit: October 13, approximately 3:30 AM Central

- Fixed a reproducible billing bug: pending payment disputes were incorrectly treated as permanent refunds, and won disputes never restored Premium.
- Added signed local Stripe webhook fixtures backed by real embedded Postgres. These exercise signature verification and state updates without contacting Stripe or using production credentials.
- Pending disputes now remain suspended through late checkout events. Won/closed inquiries restore the purchase; lost disputes remain revoked. Settled results survive late opening events, and actual full refunds cannot be undone by a dispute closure.
- Enabled handling for `charge.dispute.closed`; README now includes that event in Stripe dashboard setup.
- Full local suite: **33 tests passed** across 9 files. TypeScript and compiled preview build passed.
- Focused compiled-server browser checks: **6 passed**, covering editing/save/reload, consent choices, and unauthenticated/cross-origin boundaries at desktop and mobile sizes.
- No live provider verification was performed; credentials and provider dashboard setup remain outstanding.

## Initial build results

- TypeScript: passed.
- Unit and real embedded-Postgres integration tests: **28 passed** across 8 test files.
- Compiled Next.js 16.4 production bundle in explicit local preview mode: passed, using Webpack.
- Desktop/mobile browser checks against the compiled server: **18 passed** in 22.6 seconds.
- Accessibility: no serious or critical violations in WCAG 2A/2AA/2.1AA checks of homepage, editor and cookie policy at desktop/mobile sizes, including contrast.
- Formatting: all files passed Prettier check.
- Production dependency audit: **0 known vulnerabilities** reported by npm audit --omit=dev.
- Production build/start refuse missing required service/operator/provider configuration; the setup command reports missing variable names without exposing values.
- Source and dependencies remain at D:/Vibecoding/Projects/Ownspace. npm cache is on D:. Screenshots and test artifacts are on D:. User-facing setup documents/screenshots may be copied to this chat's outputs directory.

## Browser coverage

Actual profile in a rotatable phone; theme switching; phone reset; changing reduced-motion preference; private browser drafts; incomplete draft restoration; invalid URL rejection; link ordering; save/reload; full preview; blocked publication without authentication; mobile overflow; consent rejection/reopen/category changes; request-level GPC overrides; legal/example/auth fallback routes; unauthenticated/cross-origin API rejection.

## Independent review and fixed regressions

- Nested profile branding links caused hydration failure; noninteractive previews now contain no nested anchors.
- Chakra's Emotion hydration is incompatible with the default Turbopack path; used its documented Webpack configuration.
- Refunded purchase tombstones prevent a later payment-completion webhook from restoring a refunded upgrade.
- Page deletion preserves account-bound Premium; account deletion removes the purchase association.
- Draft handles do not move the live address before publication.
- Both live and draft handles are reserved; the old address is released after publication.
- Publishing checks the reviewed version, rejecting another tab's newer private draft.
- GitHub revocation happens before the connection ID is removed; failure remains retryable.
- Meta consent revocation reaches an already-loaded SDK through its callMethod dispatcher.
- Verified Clerk user.deleted handling cleans up alternate account-deletion paths.
- Production readiness checks are wired into normal build/start.
- Scrollable previews have keyboard focus, and secondary text on light profiles meets contrast requirements.
- Incomplete browser drafts survive reloads and can be carried into a new account.
- GitHub reconnection tolerates a previously revoked account ID.
- Request-level and browser GPC keep optional tracking off.

## Decisions carried forward

- The newest two-slash brand reference is used; the earlier house-shaped mark is not the deployed logo.
- One account owns one profile. Start free, with optional one-time paid customization.
- Postgres is required for public persistence. Embedded Postgres is restricted to development or explicit local preview.
- Clerk handles GitHub social sign-in; Composio handles optional public-repository importing.
- The phone is an independently authored CSS implementation inspired by FutureUI, with no paid source copied.
- Example profiles are fictional and labeled as examples; no invented customer statistics or endorsements.
- Normal build/start validate deployment configuration. build:preview/start:preview are explicit local-only review commands.
- Public profiles are noindex by default.

## Live-service boundaries

October 14 update: Clerk development authentication is connected and its signup, test verification, login/logout, protected persistence and account deletion were verified against the real service. Production Clerk/domain configuration, external social OAuth consent and hosted deletion-webhook delivery remain unverified. Stripe, Composio and hosted Postgres still have no supplied credentials; their live checks remain outstanding. No purchase or website publication occurred. Complete the remaining production environment and provider-dashboard setup in README. Legal compliance depends on the actual operator, jurisdiction, audience, retention, taxes and provider contracts.

## Overnight automation

Paused October 13, 2026, approximately 9:30 AM America/Chicago after finishing the cutoff check. The saved automation status was verified as PAUSED. Resume only if the user requests further scheduled work; reuse this ledger and current code.

## Deferred minor items

No independent-review minor findings were deferred. Additional visual styles, custom domains, music embeds and advanced editor blocks are future scope, not broken promised functionality.

## Premium website builder: October 14

- Restored neutral grey marketing, dashboard, studio and website-editor surfaces, with the supplied house mark and lime actions. Replaced personal-page slogans and navy marketing treatments with concrete website-builder copy, smaller headings, actual website examples and explicit Free/Premium pricing limits. No customer counts, endorsements or real customer claims were added.
- New drafts use a full-width website canvas without a compulsory avatar/bio/link header. Legacy documents retain their original presentation until explicitly switched. Added background image upload/removal, colors, patterns, font, attribution and content-width settings; paid styles are disabled on Free, with an explicit downgrade reset.
- Added thirty typed Premium elements plus Section, including navigation, hero layouts, content/project grids, image gallery/lightbox, Embla carousel, Radix accordion/tabs/progress, Prism code display, countdown, comparison slider and Motion elements. Real interactions work in previews/public sites; static canvas views preserve Puck selection. Sources/licenses and restricted-library exclusions are recorded in PREMIUM-ELEMENTS.md / PREMIUM-LICENSES.md.
- Free limits are six basic blocks, three links across old/new content and one content image, with fixed neutral styling and attribution. Save/publish enforce real repository entitlement, including direct requests with forged paid/owner fields. Refunded public snapshots lose paid styles/elements; both stored snapshots remain unchanged. New over-limit saves reject with guidance instead of silently deleting edits. Unpublishing still works after a refund.
- Added a same-origin authenticated Premium source ZIP endpoint. It accepts validated content only and copies fixed public renderer/style/asset/license paths; account data, secrets, provider code and editor SDK are excluded. Actual browser download was extracted under work/browser-export-check on D:, pinned dependencies installed, and TypeScript plus Vite production build passed. The current export has a nonfatal ~618KB JS chunk warning (~193KB gzip); it includes the full renderer library.
- Final application regression suite: **229 tests passed across 36 files**. Includes every Premium type, real-PGlite API enforcement, paid/refunded publication, source/archive isolation, invalid anchors, explicit Free reset and background-upload race preservation. TypeScript and compiled preview build passed.
- Real Free development Clerk lifecycle passed: signup/verification, actual password login/logout, server authorization, rejected consent, explicit Terms gate, Premium locks, Puck drag/edit/history/recovery/save/reload, publish/unpublish, mobile preview and deletion. The synthetic identity was deleted.
- Paid browser check used a disposable development identity and local repository billing fixture, with Clerk's official testing-ticket helper. Verified searchable library insertion of five representative advanced components, narrow/wide actual content widths, image upload/background patterns, save, source download, interactive accordion preview, mobile library, publish/unpublish and public layout at390/768/1440px. Editor and public page had no serious/critical WCAG A/AA findings. Fixture and development identity were removed. No Stripe purchase or production credential was used. Initial attempts at paid password login reached the provider's Device Trust challenge; no provider security setting was disabled. The separate Free suite covers the actual password UI.
- Homepage and all four new website examples passed desktop/mobile overflow checks. Homepage accessibility had no serious/critical WCAG A/AA findings. Screenshots remain on D: under work/ and were visually reviewed.
- Independent code review found a missing downgrade reset and ineffective Premium content-width styling. Both were fixed and verified. Browser checks also caught ambiguous selector labels and a mobile library hidden in Puck's collapsed actions; controls now have explicit accessible names and a dedicated always-visible library toolbar. Premium layouts now respond to their container width, including phone previews, rather than only the browser viewport.
- Successful preview and production builds now validate their NFT manifests. A real Windows build exposed embedded development storage references despite Next.js exclusion globs. Windows build verification checked39 manifests and removed13,143 private references from metadata; follow-up checks confirmed that the source-export trace retains its public renderer/license inputs and contains no private root artifacts. Referenced database or cache files were never read or deleted by this step. The229-test total includes45 trace and emitted-output validation tests. The first hosted build compiled successfully but exposed legitimate Vercel `.func` aliases in `.next/output`; NFT scans are now bounded to root manifests and `.next/server`, with a separate check of already-emitted Node/Edge function maps. The reproduced alias case and private emitted-asset rejection both pass, and independent review found no release blockers.
- Hosted operational checks remain blocked by undecided legal/operator/infrastructure facts, production Clerk/webhook/database setup and optional Stripe/Composio configuration. No live purchase, social OAuth approval or production account/publish check is claimed. Existing hosted readiness guards remain in force.

## Stripe checkout completion: October 14

- Completed account-level one-time Premium billing at /dashboard/billing, linked from pricing, dashboard, website canvas and account settings. Customers can upgrade before a website exists. Added current agreement controls, cancellation, delayed confirmation/failure, manual retry, historical refund and pending repurchase states. Payment polling never saves a document or changes its version.
- Checkout uses the authenticated Clerk owner and server Price, checks the active one-time amount/currency, and uses a persistent retry seed plus database row lock to reuse open sessions across tabs. Ambiguous network failures reuse identical idempotent parameters; completed unsettled payments block a second checkout. Failed/expired sessions can be replaced. Price/origin changes expire old open links first. Server-approved session history preserves fulfillment for historical prices.
- Verified signed raw webhook bodies, matching owner/client reference, price and quantity, paid-only fulfillment, delayed async success, duplicate delivery, partial/full refunds and existing dispute ordering. Oversized streamed bodies are cancelled before reading the remainder. Deletion anonymizes approved checkout history; paid fulfillment checks that association again under the billing transaction's lock.
- Final regression result: **266 tests passed across 39 files**. TypeScript, formatting, compiled preview build and private build-trace validation passed. Bounded Vitest workers to four after an unconstrained run caused multiple independent PGlite startup hooks to time out under resource contention; no timeout limits or assertions were relaxed.
- Desktop (1440px) and mobile (390px) billing checks passed with actual Clerk development sign-in and a disposable local paid fixture. Verified signed-out billing redirect, checkout error recovery, cancelled/open, pending-to-paid, failed delayed payment, historical refund with new pending payment, disputed state, canvas navigation, and real private account status. No horizontal overflow or serious/critical WCAG A/AA findings. Screenshots in work/billing-desktop.png and work/billing-mobile.png were visually reviewed. Fixture and development identity were removed after stopping the server.
- Browser payment states were intercepted and server checkout tests used mocked Stripe API calls with actual embedded Postgres and signed fixtures. **No live Stripe API purchase, real card charge, production credential or hosted webhook delivery was used.** Actual Stripe Price/key/webhook checks remain for the application's configured environment. A Codex Stripe connector does not populate Vercel env vars.
- The final env handoff check reproduced Next.js expanding an unescaped dollar price label to an empty value. .env.example now escapes the dollar sign; the guide distinguishes local dotenv syntax from the plain value used in Vercel. The actual Next.js env parser verified the corrected value.
- Independent review caught retired open-session reuse after a configured Price change. Added replacement, historical fulfillment and deletion regressions; follow-up review found no blocker. Stripe SDK pinned to23.0.0 / API2026-09-30.endive. docs/STRIPE.md and .env.example contain the exact handoff, restricted-key permissions and snapshot webhook events. Existing production Clerk/database/operator readiness guards and tax configuration boundaries remain in force.

## FMHY developer-tool evaluation: October 14

- Reviewed the developer-tool directory against the installed project stack and official upstream documentation. Puck, Radix, Motion and Playwright are already in use. Adopted Lighthouse13.5.0 as an ephemeral development audit; no app/runtime dependency, new hosted provider or telemetry integration was added. Tool cache, browser profile and reports remain on D:. Decisions and useful references are in docs/DEVELOPMENT-TOOLS.md.
- First public mobile Lighthouse run: performance78, accessibility100, best practices96, SEO66; LCP4.7s, TBT130ms and CLS0.002. A single lab run is not a real-user performance measurement. SEO is intentionally blocked by the existing incomplete-production-config/noindex guard, which was preserved.
- Lighthouse exposed a real React418 hydration error: site-mode branding links nested inside gallery card anchors. Reproduced the failure with actual server rendering, HTML parsing and hydrateRoot; passed after ProfileView forwarded its noninteractive flag to SiteCanvas. Noninteractive previews retain branding text, while default public/exported renderers retain the link. Also fixed the phone reset button's visible/accessibility name mismatch by removing its unnecessary overriding aria-label.
- Independent review found no actionable issue. All267 tests across40 files passed; TypeScript, formatting, source-export checks and the compiled build passed. Real compiled-browser checks at390/1440px passed with zero page/hydration errors, four gallery cards, successful example navigation, preserved public branding links, matching Reset view name and no overflow. Screenshots in work/fmhy-fixed-home-390.png and work/fmhy-fixed-home-1440.png.
