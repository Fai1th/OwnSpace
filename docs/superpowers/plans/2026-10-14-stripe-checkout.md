# Stripe checkout implementation plan

**Goal:** Finish the existing one-time Premium integration and provide an exact environment handoff.
**Architecture:** Hosted Stripe Checkout, server-controlled price and identity, durable checkout retries and signed snapshot webhooks. An authenticated billing screen handles agreement, purchase and bounded status checks; website drafts are never rewritten by payment polling.
**Scope:** Existing Clerk/Postgres app on D:. No credentials in source or chat, live charges, automatic tax activation or subscription conversion.

- [x] Add failing tests for checkout authorization, price validation, retry/session reuse, paid fulfillment, delayed payments and invalid webhooks.
- [x] Implement server checkout helpers and persistent attempt locking; preserve refund/dispute ordering.
- [x] Add billing screen linked from pricing, dashboard and editor; cover paid, pending, cancelled and failure states.
- [x] Document exact Stripe variables, snapshot webhook events/API version, price validation and sandbox checks.
- [x] Run focused tests, complete regression suite, types, formatting, compiled build and desktop/mobile billing checks; record service limitations.
