# Verification ledger

Verified October 13, 2026, approximately 3:19 AM America/Chicago.

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

## Final local results

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

No real Clerk, Stripe, Composio or hosted Postgres credentials were supplied. No external account was created, provider resource provisioned, purchase made or website published. Live OAuth, email delivery, checkout, provider webhooks and hosting behavior are not claimed verified. Supply environment variables and complete the provider dashboard configuration in README, then perform sandbox checks. Legal compliance depends on the actual operator, jurisdiction, audience, retention, taxes and provider contracts.

## Overnight automation

Hourly follow-up audit remains active in this chat through 9:00 AM America/Chicago October 13, 2026. Reuse this ledger and current code. Fix reproducible new issues; do not repeat all checks without a new change or unresolved concern. Stay quiet when nothing meaningful changes. Pause the automation after the 9 AM cutoff.

## Deferred minor items

No independent-review minor findings were deferred. Additional visual styles, custom domains, music embeds and advanced editor blocks are future scope, not broken promised functionality.
