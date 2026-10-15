# Stripe setup

Ownspace sells **one-time account Premium** through hosted Stripe Checkout. A Stripe connection in Codex is separate from the application's Vercel environment; the app needs the following values. Never paste secrets into chat or commit an env file.

## Environment variables

Add these in Vercel for the intended environment, and in ignored `.env.local` for local testing:

| Variable                           | Value                                                                                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`                | Server API key from the same Stripe account and mode as the Price. A restricted `rk_test_…` / `rk_live_…` key is preferred; `sk_test_…` / `sk_live_…` also works. |
| `STRIPE_PREMIUM_PRICE_ID`          | The active **one-time Price ID**, beginning `price_`. Not a Product ID or Payment Link.                                                                           |
| `STRIPE_WEBHOOK_SECRET`            | The `whsec_…` signing secret for this application's webhook endpoint and environment.                                                                             |
| `NEXT_PUBLIC_SITE_URL`             | The actual public HTTPS origin, e.g. `https://own-space.vercel.app`, without a path.                                                                              |
| `NEXT_PUBLIC_PREMIUM_PRICE_LABEL`  | Display price, e.g. `$12`. Match the real Price.                                                                                                                  |
| `NEXT_PUBLIC_PREMIUM_PRICE_AMOUNT` | Amount in the currency's Stripe minor unit, e.g. `1200` for USD12.                                                                                                |
| `NEXT_PUBLIC_CURRENCY`             | Price currency, e.g. `USD`.                                                                                                                                       |

For a local dotenv file, escape dollar signs: `NEXT_PUBLIC_PREMIUM_PRICE_LABEL=\$12`. In Vercel’s environment-variable field, enter plain `$12` without a backslash. Quoting the dotenv value alone does not prevent Next.js variable expansion.

The three Stripe server variables must be supplied together. Price label/amount/currency default to USD12; configure all three to match your actual product. The app checks the active Price's amount, currency and one-time type before opening checkout. Hosted Checkout does not require a browser Stripe publishable key.

For a restricted key, grant Checkout Sessions **write/read**, Prices **read**, and PaymentIntents **read** (for expanded delayed-payment status). No customer write, refund creation, balance, transfer or payout permissions are used.

## Stripe dashboard

1. Use your existing active one-time Price. Choose the same sandbox/test or live mode as the server key.
2. Configure the public business name, support details, Terms URL and Privacy URL in Stripe's Checkout/business settings. The application requires Terms acceptance before checkout and Stripe Checkout requires its own Terms confirmation.
3. Add an event destination for **your account**, with **snapshot** payloads and API version **2026-09-30.endive** (the pinned Stripe23 SDK version).
4. Set the webhook endpoint to:
   `https://YOUR_DOMAIN/api/webhooks/stripe`
   For the current Vercel domain: `https://own-space.vercel.app/api/webhooks/stripe`.
5. Subscribe to exactly the events this integration processes:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `charge.refunded`
   - `charge.dispute.created`
   - `charge.dispute.closed`
6. Copy that endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`. A local Stripe CLI listener has a different signing secret.
7. Enable successful-payment receipts in Stripe if desired; Ownspace does not send purchase emails itself.

Use a publicly accessible webhook URL. Preview deployment protection must not intercept Stripe deliveries. Test and production webhook secrets and Price IDs must be configured separately. Do not use a live API key for local tests.

## Activate and verify

Existing Clerk, Postgres and legal/operator environment values remain required; see [.env.example](../.env.example) and [README](../README.md). A Stripe app connection does not populate these automatically.

Run:

```powershell
npm run setup -- --production
npm run validate:production
```

Setup installs the idempotent schema, including durable checkout attempts and approved session history, and checks the configured Price without printing secret values. The server also installs missing tables when its repository first connects. Redeploy after setting environment variables, especially `NEXT_PUBLIC_` display/origin values.

In a **sandbox**, sign in, open `/dashboard/billing`, accept the current Terms and eligibility confirmation, then use Checkout. Confirm paid access only after the signed event is processed. Verify cancellation, delayed confirmation, declined/failed payments and a full test refund. The purchase screen has bounded polling and a manual status check. It never rewrites your website or version. Open sessions are reused across tabs; ambiguous network retries use the same Stripe idempotency key. Completed payments awaiting confirmation block another checkout. Fully refunded or lost-dispute purchases can be repurchased, with a new pending purchase checked independently from the historical refund.

For local delivery with an installed/authenticated Stripe CLI:

```powershell
stripe listen --forward-to localhost:3003/api/webhooks/stripe
```

Use the listener's `whsec_` value in the local server environment and restart it. Complete an actual app-created sandbox Checkout Session; generic CLI fixture events do not contain Ownspace's owner metadata and configured Price and must not unlock Premium.

To repeat the browser UI check without a payment, use the existing disposable development fixture: stop the server, run `npx tsx scripts/verify-premium.ts prepare` with `OWNSPACE_LOCAL_PREVIEW=1`, start the compiled local preview with nonfunctional Stripe fixture values, and run `npx tsx scripts/verify-billing.ts`. It intercepts checkout/payment states in the browser, verifies real development auth and local paid status, checks desktop/mobile layout and accessibility, and makes no Stripe purchase. Stop the server and run the fixture's `cleanup` command afterward. Never use this against production.

## Operational boundaries

- A return URL, client state or editable JSON cannot grant Premium. Only signed paid Checkout events with matching owner, Price and quantity update the account ledger.
- Unpaid completion waits for async success. The billing screen reads the current session's PaymentIntent to identify delayed failure, without granting access from that response.
- Price changes expire obsolete open links before replacement. A server record preserves approved historical prices for delayed completion; editable Stripe metadata alone cannot approve a retired price.
- Duplicate events are idempotent. Full refunds and disputes update entitlements; prior refund/dispute tombstones survive reordered completion events.
- Premium applies to the account even before its website exists. Deleting a page preserves it; deleting the account removes the account association and its checkout attempt. Historical checkout records are anonymized, and fulfillment rechecks deletion inside its transaction.
- Automatic tax collection is **not enabled**. Confirm applicable registrations, tax treatment and refund terms before selling; this integration is not a tax or legal certification.

Official references: [Hosted Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment?payment-ui=stripe-hosted), [webhook signature verification](https://docs.stripe.com/webhooks), [idempotent requests](https://docs.stripe.com/api/idempotent_requests), [API-key practices](https://docs.stripe.com/keys-best-practices).
