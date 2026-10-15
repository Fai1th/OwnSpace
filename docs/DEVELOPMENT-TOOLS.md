# Development tool selection

Reviewed [FMHY's developer-tools index](https://fmhy.net/developer-tools) against Ownspace on October 14, 2026.

## Adopted for development

**[Lighthouse](https://github.com/GoogleChrome/lighthouse)** adds mobile performance, browser-console and document audits to the existing functional and axe checks. Run it as a one-off CLI; no application dependency, paid service, analytics or new account is needed. Its package cache, browser profile and reports belong on D:.

Initial public-homepage run with Lighthouse13.5.0, its default simulated mobile profile: performance78, accessibility100, best practices96, SEO66; LCP4.7s, total blocking time130ms and CLS0.002. These are lab results from one run, not field-user metrics. The SEO deduction is intentional: the launch-readiness guard emits noindex while required production configuration is incomplete.

The report found a real React418 hydration error. Gallery cards wrap website previews in links, but site-mode branding was still a link inside each preview. The browser rewrote the nested anchors before hydration. A regression test reproduces the actual server-render/HTML-parse/hydrate sequence. Noninteractive website previews now preserve branding as text; published websites and default exported renders retain the branding link. Also removed a phone reset button's overriding accessible label, so its visible “Reset view” text is its accessible name.

Reports are under ignored `work/fmhy-home.report.html` and `work/fmhy-home.report.json`. Existing official source: [React418 explanation](https://react.dev/errors/418).

## Keep the current stack

FMHY also lists Puck, Radix UI, Motion and Playwright. Ownspace already uses all four for the canvas, accessible interactive elements, motion and browser checks. Its existing Chakra/Saas UI controls and Vitest/axe checks remain appropriate. Adding another complete UI kit, editor or API-testing app would duplicate current capabilities.

## Useful references, without an integration

- **[deps.dev](https://docs.deps.dev/):** inspect dependency graphs and security advisories before adding future component packages. Existing source/license notices still determine which code is suitable for the paid component library and source exports.
- **[Big List of Naughty Strings](https://github.com/minimaxir/big-list-of-naughty-strings):** a useful source of input-edge-case fixtures when extending text, URL and export handling. Its data is MIT licensed. No bulk corpus was added during this review.
- Additional hosted monitoring, analytics, alternative backends and visual builders are deferred: this review found no current gap that warrants another provider or runtime framework.

Do not use a directory listing as permission to copy a component marketplace's source; verify the specific upstream terms before paid redistribution.
