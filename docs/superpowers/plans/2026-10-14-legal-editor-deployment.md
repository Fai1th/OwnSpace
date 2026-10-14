# Ownspace legal, editor and deployment implementation plan

**Goal:** Expand the legal/privacy center based on TermsFeed and Termly's public guidance, provide a real visual page editor from the authenticated dashboard, and fix failed Vercel builds without enabling an unconfigured public service.

**Architecture:** Puck MIT React editor with bounded trusted components and typed JSON saved in existing private draft/published snapshots; existing profile renderer remains compatible. GrapesJS BSD utilities may inform or power safe presentation helpers, with notices; Webstudio/Easyblocks AGPL code is not copied (user selected permissive reuse). Legal text is original and reflects actual product behavior. Missing operator details stay configurable. Compile/build succeeds independently of public-launch readiness; hosted APIs/auth pages/public profiles fail closed until required configuration is complete.

**Tech Stack:** Next 16.4, React 19, Clerk, Puck, Zod, Postgres, Vitest, Playwright. D:/Vibecoding/Projects/Ownspace only for project code/cache/artifacts.

**Spec:** Current user request and docs/BUILD-PLAN.md. User confirms business identity/domain undecided; chooses permissive code and independently recreated AGPL interactions.

## Task 1: Vercel build/readiness

- Preserve strict deploymentIssues validation; add hosted-runtime guard.
- Change build preflight to warning by default; explicit production validation remains failing.
- Pin supported Node 24, remove Windows-only cache paths from tracked npm configuration.
- Test missing config, partial keys, request boundary and public profile setup behavior.
- Verify actual Vercel logs: failure exits pre-compilation because every required env is absent. Test remote preview build when source is ready; never fabricate legal identity.

## Task 2: Legal center

- Expand original terms/privacy/cookie policies and add acceptable use, refunds, copyright, subprocessors and privacy-rights choices.
- Clear draft/configuration notice while operator details are undecided. Provide actual export/delete and cookie-withdrawal controls; never claim submission/email delivery if none occurs.
- Document TermsFeed/Termly research and licenses/attribution. No copied proprietary policies or legal-certification claims.
- Add server-recorded versioned agreement at publication and checkout boundaries (root integration).

## Task 3: Dashboard and visual editor

- Authenticated /dashboard links to /editor, /studio profile tools and existing settings. Do not invent the later dashboard mockup.
- Extend Profile with optional bounded website document, keeping old profiles compatible.
- Puck: typed header/text/link/image/spacer/section components, native undo/redo and selection/layers, responsive preview and structured style controls. No arbitrary HTML/scripts/embeds.
- Persist via existing authenticated versioned save/publish APIs; protect unsaved edits and reject conflicts. Render validated document on public page.
- Respect existing entitlement restrictions. Add license notices and comparison of referenced editors.

## Verification

- Fail-first schema/route regression tests; full existing suite, types, compiled build, formatting.
- Desktop/mobile legal choices and page-builder save/reload/preview; real Clerk test identity with cleanup.
- Review staged changes for credentials; commit and push only code. Runtime-configured launch remains blocked until user provides real business/provider details.
