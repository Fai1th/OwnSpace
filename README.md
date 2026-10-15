# Ownspace

A website builder with a full-width React canvas, a Premium component library and downloadable React source. All local source, dependencies and generated artifacts live in **D:/Vibecoding/Projects/Ownspace**.

## Run the local product

Node 24 (the supported Vercel runtime).

```powershell
cd D:\Vibecoding\Projects\Ownspace
npm ci
npm run dev
```

Open http://localhost:3000. Use localhost consistently for Clerk development sessions; the SDK normalizes loopback IPs and Next.js can otherwise proxy requests back to itself. Without service keys, the editor saves a private browser draft; it does not pretend to publish or charge money. Examples are explicitly fictional demonstration websites.

## Configure production

Copy `.env.example` to `.env.local`, then supply the real values. Never commit secrets. Public `NEXT_PUBLIC_` values are included in the browser bundle, so never put a secret in one.

Required:

- `NEXT_PUBLIC_SITE_URL`: the final HTTPS origin, without a path or trailing slash.
- Clerk publishable key, server secret, and webhook signing secret.
- `DATABASE_URL`: a production Postgres connection string; a free Postgres tier is enough to start. No database vendor is provisioned by this project.
- Legal operator name, postal address, support email, jurisdiction, hosting/database provider names and storage region. Adjust retention and minimum-age configuration for the actual business and deployed services.

```powershell
npm run setup -- --production
npm run build
npm start
```

The setup command installs the idempotent schema and, when enabled, checks the Stripe price. Builds can complete with incomplete configuration, but hosted signup, account APIs, publishing and billing stay unavailable until required configuration is complete. Run `npm run validate:production` for the strict launch check. On a hosting platform, put the same environment variables in its configuration and use `npm run build` as the build command.

For a credential-free compiled preview:

```powershell
npm run build:preview
npm run start:preview
```

These explicitly bypass production readiness only for a local preview, bound to localhost. They are not public deployment commands. Development storage uses embedded Postgres at `LOCAL_DATABASE_PATH`, on D:. Production requires real Postgres.

## Clerk

The Ownspace development application is connected locally; its keys are in ignored .env.local, never in Git. Term uses its own separate application. On another machine, use the Clerk CLI to link Ownspace and pull its development environment. Production activation remains a separate domain/provider setup step.

1. Create/configure an application, set allowed origins and the supplied sign-in/sign-up paths.
2. Enable GitHub in Social Connections if GitHub sign-in is wanted; this is separate from repository importing.
3. Configure Clerk signup legal acceptance using your actual Terms/Privacy URLs and an age/guardian policy suitable for your audience.
4. Add a webhook for `user.deleted` at `https://YOUR_ORIGIN/api/webhooks/clerk`; set `CLERK_WEBHOOK_SIGNING_SECRET`. This removes published data and revokes GitHub connections even if deletion happens inside Clerk's account UI or dashboard.
5. Verify account creation, social sign-in, sign-out and deletion with test accounts before using live keys.

For local auth verification after starting the app, run `npm run test:auth`. It requires development keys and a localhost server, creates one synthetic `+clerk_test` identity, checks signup/email verification, login/logout, API ownership, saved drafts, mobile layout and account deletion, then removes the test identity. No real verification email is sent. Set `OWNSPACE_AUTH_TEST_URL` to a different localhost port when needed. Screenshots/results are written to `work/` on D:. These checks never accept production keys.

The provider has built-in local sign-in/sign-up URLs and redirects back to /dashboard after authentication, even if only the two Clerk keys are configured. Signed-in navigation shows Dashboard and the account menu. Keep email verification enabled. Development Google/GitHub social connections use Clerk's development configuration; production OAuth needs its own approved credentials and domain setup.

## Website plans and editor

Open `/editor` from the authenticated dashboard. New drafts start with a full-width website canvas; legacy profile drafts keep their existing layout until their owner changes it. Add blocks from Puck or search the element library, edit their properties, preview at phone/tablet/desktop widths, save, then publish the saved snapshot.

Free includes one website, six basic blocks, three links across legacy and website content, one content image, fixed neutral styling and Ownspace attribution. Premium includes up to forty blocks, thirty advanced elements plus sections, custom colors/background uploads/patterns/content width, attribution removal and React source ZIP export. All paid elements and backgrounds are checked in the server repository; client flags cannot grant access. Refunds project public pages back to Free limits while retaining the private original. Owners can explicitly reset paid appearance to Free and remove paid blocks to resume saving.

Library sources and license notices are in `docs/PREMIUM-ELEMENTS.md` and `docs/PREMIUM-LICENSES.md`. Radix, Embla, Motion and Prism power actual interactions; the other compositions are original code. Components whose licenses restrict paid bundling are excluded. `docs/SOURCE-EXPORT.md` describes the ZIP boundary and setup. The ZIP is an editable React/Vite/TypeScript project; arbitrary customer JavaScript does not execute on Ownspace’s hosted canvas.

For a repeatable paid browser check, stop the local server, set `OWNSPACE_LOCAL_PREVIEW=1`, then run `npx tsx scripts/verify-premium.ts prepare`. Start the compiled preview at localhost:3003 and run the same script with `check`. Stop the server and run `cleanup` afterward. It requires D:, embedded local storage and Clerk development keys, creates a disposable local paid fixture without a purchase, uses Clerk’s official testing-ticket helper, and removes that fixture and identity afterward. The separate `npm run test:auth` checks actual signup and password-login UI on a Free account. Never run either against production.

## Optional one-time Premium

Exact variables, restricted-key permissions, dashboard configuration and activation steps: [Stripe setup](docs/STRIPE.md). Open `/dashboard/billing` to upgrade before or after creating a website. Pricing, dashboard, canvas and account settings all link there.

Set all three Stripe variables together. Configure an active **one-time** price, price amount in minor currency units, displayed price label and currency. The default design uses $12 USD, but these values are configuration, not provider identifiers.

Use a separate Stripe sandbox while testing. Prefer a restricted API key with the permissions required to read prices and Checkout line items and create Checkout Sessions. Configure your Terms/Privacy/support URLs in Stripe's public business settings; checkout requires terms acceptance.

Webhook URL: `/api/webhooks/stripe`. Subscribe to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `charge.refunded`
- `charge.dispute.created`
- `charge.dispute.closed`

Entitlement is granted only by a verified webhook, never by the success URL. Checkout validates the configured active one-time Price and reuses open sessions across tabs; persistent retry seeds protect ambiguous network failures. Expired/failed sessions can be retried, while completed payments awaiting confirmation block another checkout. After returning from checkout, the billing screen makes bounded status checks and offers a manual check for delayed payments. These checks never overwrite draft content or refresh its concurrency version. The billing screen distinguishes delayed failure and a pending repurchase from an older refund. Premium is read from the account’s purchases even when its page has been deleted. Events are idempotent; refund tombstones prevent late completion from re-granting refunded purchases. Full refunds revoke an upgrade. Pending disputes suspend the disputed purchase; a won or closed inquiry restores it, while a lost dispute keeps it revoked. Settled dispute results survive late opening or checkout events. Page deletion keeps the purchase on the account; account deletion removes the association. Keep Stripe financial retention and refund policies aligned with applicable law.

The current integration does not automatically collect sales tax. Configure registrations and the correct tax treatment before selling in jurisdictions requiring collection. No tax-compliance claim is made by this code.

## Optional GitHub importing through Composio

Set `COMPOSIO_API_KEY` and `COMPOSIO_GITHUB_AUTH_CONFIG_ID`. Create a GitHub OAuth auth configuration for the actual app and allow its callback origin. For public-repository importing, use minimum public-information permissions; do not request broad private-repository or write access. Ownspace uses hosted `connectedAccounts.link()`, verifies active connections against the signed-in owner, and calls only `GET /user/repos` with public visibility. No user token is returned to the browser.

The user chooses which repositories become links. Importing never publishes automatically. Disconnection and deletion revoke the Composio connection before forgetting its identifier. Configure and test provider OAuth callbacks before launch.

## Privacy and legal configuration

Analytics and marketing are opt-in, independently selectable, with equally accessible acceptance and rejection. Cookie preferences can be reopened from any marketing footer or account Settings. Choices survive blocked localStorage using the first-party cookie and synchronize between open tabs; focus/visibility checks provide a fallback when cross-tab messaging is unavailable. GPC keeps optional tracking off. No tracking integration is enabled unless its ID is configured.

If configured, Google Analytics and Meta Pixel are loaded only after the corresponding consent. Withdrawal disables the integration and removes accessible first-party cookies. Previously sent provider data cannot be removed simply by deleting local cookies.

Policies use real configured operator/provider details. The implementation is not a universal legal certification: the operator must confirm the policies, age/guardian treatment, consumer cancellation rights, actual log/backup retention, data processing agreements, transfers, intellectual property and taxes for the business's jurisdiction. Do not launch with template operator text. Production validation blocks missing operator/provider details.

User images are resized in-browser, converted to JPEG and stripped of original metadata. Profiles accept no scripts, raw HTML or embeds. External links use public HTTPS and are marked as user-generated. Public profiles are noindex by default for privacy; marketing pages have a sitemap.

## Reports and moderation

`/report` accepts bounded, rate-limited reports. Review them regularly:

```powershell
npm run moderate -- list
npm run moderate -- unpublish REPORT_ID
npm run moderate -- resolve REPORT_ID
```

Only use these commands with an authorized operator connection. There is no public admin API. They also prune old rate-limit rows. Set up an actual moderation/contact operating process; software alone cannot guarantee user content is lawful.

## Product

- Dashboard at `/dashboard` with private-draft/publication status, agreement controls and access to the visual editor.
- Puck-powered `/editor`: drag blocks, nested sections, responsive properties, layers, undo/redo, preview, export and versioned account saves. See `docs/EDITOR-INTEGRATION.md` and `THIRD_PARTY_NOTICES.md` for the permissive-code reuse boundary.
- Legal center at `/legal` with terms, privacy, cookies, acceptable use, payments/refunds, copyright, providers and privacy choices. Policies remain marked as drafts until the undecided operator details are configured; see `docs/LEGAL-RESEARCH.md`.
- Explicit versioned Terms/eligibility confirmation is required server-side before publishing or starting a purchase; optional cookie consent is separate.
- Four visual styles, profile photo/cover, bio, up to 20 ordered links, six image cards.
- Live mobile/wide/full-screen preview, optimized uploads, draft export.
- Private drafts separate from publication; draft handles stay reserved alongside live handles until publication.
- Optimistic version checks for saving and publishing across multiple tabs.
- Publish/unpublish, real public profile URLs, consented view counts.
- Clerk auth, optional Composio import, optional Stripe paid customization.
- Account/page deletion, data export, consent controls and reporting.

## Verify

```powershell
npm run typecheck
npm test
npm run build:preview
# With local server running:
npm run test:e2e
```

Browser tests use installed Microsoft Edge at desktop and iPhone-sized viewports. Test traces and screenshots stay on D:. Set TEMP/TMP to the project work folder when running browser checks if browser temporary profiles must also stay on D:.

`docs/VERIFICATION.md` records actual checks, fixed issues and live-service gaps.
`docs/BUILD-PLAN.md` records design and architecture decisions.

## Design and licenses

The mark uses the user-supplied Ownspace house logo; brand colors are centralized CSS tokens. Four abstract SVG artworks are authored for this project. Manrope is self-hosted through its licensed font package. Icons use Phosphor. The app controls use the official Chakra library with the Saas UI Chakra preset. Webpack is used because Chakra documents Emotion hydration problems with Turbopack.

The phone is an independent CSS implementation inspired by the referenced FutureUI behavior. No premium FutureUI source or paid Saas UI components were copied. See `THIRD-PARTY-NOTICES.md`.
