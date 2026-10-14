# React source export

Premium account holders can download the current validated draft as a standalone React/Vite/TypeScript project with `POST /api/site-export` and a JSON body `{ "profile": ... }`. The draft does not need to be saved first. The editor supplies content only; the server determines identity and entitlement.

The route checks the deployment boundary, exact same-origin policy and Clerk identity before reading the server repository entitlement. A Free account receives HTTP 403 even if it supplies a forged owner or paid flag. Requests are limited to 1,700,000 bytes, parsed through the public profile schema, and returned as `application/zip` with a safe handle filename and `Cache-Control: private, no-store`. Unknown profile fields are stripped; nested website/settings schemas reject unknown executable properties.

`lib/site-source-export.ts` defines the complete fixed allowlist. It does not recursively walk directories, accept filenames from the request or fetch remote content. It rejects filesystem symlinks/junctions and paths escaping the project root. It copies only public renderers, pure public schemas/helpers, styles, eight bundled SVGs and public dependency license notices. It generates its own package/config/README files, keeping user content in `src/data.json`; the HTML and TypeScript templates never interpolate user text. This prevents HTML-looking display names from becoming markup or scripts.

No environment files, server routes, authentication, billing, database modules, account/provider records, repository metadata, caches, editor SDK or Next.js code are included. The exported renderer has no hosted account services. Uploaded PNG/JPEG/WebP images remain embedded in the JSON. Artwork uses `/art/` paths, so the README documents root-domain hosting.

The project pins public dependencies to their installed stable versions, TypeScript and types to installed versions, and Vite 8.3.4 / React plugin 6.1.2 to the versions verified when implemented. Run `npm install`, `npm run dev` or `npm run build` with Node.js 24 LTS. The output of the build is the static `dist/` directory. Public library license texts are bundled, including the Manrope OFL license and TypeScript Apache notice. Embla omits its license in npm; the generator includes its upstream v8.6.0 MIT notice. The renderer attribution says Ownspace without asserting a separate operator legal identity.

## Hosting file tracing

The Node route reads allowlisted sources at runtime. The production Next.js configuration must include these assets for `/api/site-export` via `outputFileTracingIncludes`:

- `./components/profile-view.tsx`, `./components/site-canvas.tsx`, `./components/site-canvas.css`
- `./components/website-blocks.tsx`, `./components/website-blocks.css`
- `./components/premium-elements/{index,shared,content,media,interactive,motion}.tsx` and `./components/premium-elements/premium-elements.css`
- `./lib/{profile,site-safety,site-settings,website,premium-elements,plans}.ts`
- `./app/globals.css`
- `./public/art/{avatar-jules,avatar-kai,avatar-noor,avatar-sam,mountain,orbit,sky,still-life}.svg`
- `./node_modules/{react,react-dom,@fontsource-variable/manrope,@phosphor-icons/react,@radix-ui/react-accordion,@radix-ui/react-tabs,@radix-ui/react-progress,embla-carousel-react,embla-carousel,prism-react-renderer,motion,zod,typescript,@types/react,@types/react-dom,@types/node}/package.json`
- Exact license files listed by `LICENSE_FILES` in the generator. They are `LICENSE` in each listed direct package except Embla (embedded), Motion (`LICENSE.md`) and TypeScript (`LICENSE.txt`, `ThirdPartyNoticeText.txt`).

Braces above are documentation shorthand; explicit paths or supported globs should be used in the actual Next.js config. Do not add broad application or environment-file globs. Keep this allowlist and the tracing configuration aligned whenever a renderer import is added.

## Build artifact privacy

Next.js can trace the embedded development database into local Windows NFT manifests even when its configured exclusion globs are present. Successful production and preview builds run `scripts/sanitize-build-traces.ts` afterward. It validates every generated manifest before rewriting any, removes only references to project-root credentials/development data/caches, preserves public renderer and dependency inputs, and never reads or deletes the referenced private data. Unsupported roots, absolute/escaping paths, filesystem links and malformed trace metadata stop the release. Only root NFT files and the regular `.next/server` tree are traversed. Vercel emits legitimate function aliases under `.next/output`; those links are not NFT inputs. Since the adapter can materialize function assets before the post-build step, `validate-vercel-output.ts` also checks the already-emitted Node/Edge `filePathMap` values and destinations for private project files. Valid internal function aliases are checked without traversal; external framework source references remain supported. The exact source-export tracing allowlist remains authoritative for required runtime files.

## Verification

`tests/site-source-export.test.ts` opens the real generated ZIP, checks required project/assets/license entries, confirms private injected fields are absent, verifies every public source import resolves within the ZIP or its declared dependencies, verifies explicit version pins, rejects unsafe content and refuses a junction in an allowlisted source path.

`tests/site-source-export-route.test.ts` uses the real HTTP origin/body helpers while replacing external identity/repository services. It covers signed-out access, forged entitlement, cross-origin and missing-origin requests, unavailable hosted services, invalid profile data, advertised and streamed body overflow, and a paid unsaved-draft ZIP response. These tests do not call production services.

Release verification must also extract a real ZIP, install its pinned dependencies, and run its typecheck/build. A source archive passing unit tests alone does not demonstrate a successful standalone production build.
