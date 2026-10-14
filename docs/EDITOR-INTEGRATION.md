# Editor integration

Ownspace uses **Puck 0.23.0** (`@puckeditor/core`, MIT) as the actual React visual editing engine on `/editor`. Its component drawer, selection overlays, draggable layers/outline, nested slots, keyboard interactions, undo/redo history and mobile/tablet/desktop canvas are upstream Puck functionality. The dashboard opens this editor, alongside the pre-existing profile tools at `/studio` and account settings.

## Reuse and inspirations

- **Puck**: shipped dependency and its native UI/data APIs, with Ownspace's component configuration, save/publication controls, scoped dark theme and upload field. The `no-external.css` export avoids Puck's optional remote Inter font import. Sources: [repository](https://github.com/puckeditor/puck), [MIT license](https://github.com/puckeditor/puck/blob/main/LICENSE), [Puck API](https://puckeditor.com/docs/api-reference/components/puck), [slot API](https://puckeditor.com/docs/api-reference/fields/slot). Puck is loaded only on the editor route; public profiles use ordinary React renderers.
- **GrapesJS** (BSD-3-Clause): evaluated as a permissive full editor. Its component/block/layer workflow informed the comparison, but no GrapesJS source or dependency is shipped. A second editor runtime would duplicate Puck and require a separate HTML/CSS conversion boundary. [Source and license](https://github.com/GrapesJS/grapesjs/tree/dev/packages/core).
- **Webstudio** and **Easyblocks** (AGPL-3.0): visual reference for a selected-object properties panel, breakpoint controls and structured editable sections. These interactions are provided through Puck APIs and independently authored Ownspace React components. No source, assets, styles or examples from these projects are copied, bundled or adapted. [Webstudio](https://github.com/webstudio-is/webstudio), [Easyblocks](https://github.com/easyblocks/easyblocks).

## Full website canvas and Premium library

The October 14 extension adds optional strict `Profile.site` settings: website/profile layout mode, background and foreground colors, a bounded raster background image, pattern and content width. New drafts use website mode without the forced legacy avatar/bio/link header. Existing drafts retain their layout. The original basic document types below remain supported; the document union also includes all thirty typed elements in `lib/premium-elements.ts`. Section slots accept these leaves, with one nesting level and forty blocks across the entire document.

The searchable library uses Puck’s public insert action, preserving native undo/redo. Its toolbar remains visible on mobile. Basic blocks stay in the native drawer; paid drawer categories and insertion permissions reflect the account’s server entitlement. API save/publish checks remain authoritative. Locked library previews do not grant insertion or source export. Widget previews are static inside the editing canvas and interactive in the preview dialog and published site.

See `docs/PREMIUM-ELEMENTS.md`, `docs/SOURCE-EXPORT.md` and `lib/plans.ts` for current controls, license notices and exact limits. New invalid or over-plan saves fail with actionable messages and retain current edits. Published refunded pages use a Free projection; private snapshots remain intact. The canvas settings include an explicit reset-to-Free-appearance action.

## Document contract

The backwards-compatible optional `Profile.website` field is:

```ts
{
  version: 1,
  root: { props: {} },
  content: Array<
    | { type: "Heading", props: { id, text, size, mobileSize, align } }
    | { type: "Text", props: { id, text, size, mobileSize, align } }
    | { type: "Link", props: { id, label, url, align } }
    | { type: "Image", props: { id, image, alt, caption, shape } }
    | { type: "Spacer", props: { id, size, mobileSize } }
    | { type: "Section", props: { id, tone, padding, mobilePadding, content: LeafBlock[] } }
  >
}
```

`size`/`mobileSize` and padding are `small | medium | large`; alignment is `left | center | right`; image shape is `natural | square | wide`; section tone is `plain | soft | outline`. A section can contain leaf blocks, never another section. IDs use ASCII letters, digits, underscores or hyphens and are globally unique. Maximum 40 total blocks, 20 leaves per section, 1.1 million serialized characters and 350,000 characters per image. Text, captions, URLs and IDs have separate bounds in `lib/website.ts`. Uploaded JPEG/PNG/WebP files use the existing local canvas optimizer (at most 300,000 output characters). Public HTTPS links reject credential URLs, IP literals and local hostnames. Images allow the existing local `/art/*.svg` assets or bounded uploaded raster data; no remote image URL inputs.

Puck injects the editor-only `root.props.id = "root"`. The adapter canonicalizes the empty author root to `{props:{}}` before comparison, validation and persistence. Public/server schema validation remains strict and rejects arbitrary props, raw CSS, HTML, scripts, embeds and unsupported component types. Trusted React renderers escape text and defend links/images again at render time.

## Rendering and entitlements

The original profile header, existing links and image cards render first. Website blocks follow; mandatory free branding renders last. The Puck canvas supplies its children through `ProfileView.websiteContent` to avoid recursive website rendering or duplicate primary headings. Custom heading blocks are `h2`. The exact same leaf/section React components render saved public documents, without loading Puck on public pages. Responsive CSS uses the profile container width, including the Puck iframe viewport, to choose the bounded mobile values below 600px. Font, accent, profile layout and branding remain controlled by the existing server entitlement sanitizer; the new block fields cannot set them.

## Account workflow

Server page boundaries apply hosted launch readiness before authentication. Configured accounts require Clerk sign-in. Unconfigured private local use offers the existing browser draft demo; no API publishing is available there. The dashboard includes the versioned agreement component; publication and checkout enforce agreement on the server.

`GET /api/profile` loads the private draft and account entitlement. With no saved account page, an existing browser draft is restored and remains unsaved to the account. **Save draft** sends a validated complete profile and the last acknowledged version to `PUT /api/profile`. A response acknowledges only that submitted snapshot. Edits made while the request is running remain dirty. Server normalizations replace unmodified fields; normalized website data remounts the canvas only when its submitted content has not been edited in flight. Conflicts preserve edits and explain the API error. Export keeps a recoverable JSON copy. Internal editor links and browser unload warn about unsaved edits. Same-document Back/Forward navigation also keeps unsaved controlled fields and blocks in bounded in-tab module memory. Recovery is keyed by the authenticated owner returned from `GET /api/profile` (with a separate demo scope), never private localStorage or sessionStorage. Returning to the editor announces recovered unsaved edits; the original optimistic version remains in use, so a newer remote save produces a conflict. A deleted saved profile discards its previous recovery. Acknowledged saves clear recovery only if no newer edits exist; revision guards protect a remounted editor from an old request acknowledgment. The cache holds at most three scopes, two million serialized characters per entry and four million total. Recovery lasts only for the current tab runtime and does not survive reload or closing the tab. Save or export before closing the tab.

**Publish saved page** is a distinct action, disabled while the visible draft has unsaved changes. It sends `{publish:true,version}` to `/api/publish`; it never silently saves. Unpublish preserves the saved draft. Publishing uses the server's saved snapshot and agreement gate. Public-page links use the published handle, including while a new draft handle differs. Browser-only demo saves use the same versioned local draft storage key as the existing profile tools.

## Verification and remaining configuration

Meaningful tests cover document safety/bounds, duplicate IDs and section depth, legacy compatibility, entitlement protection, public rendering/escaping, save-in-flight edits, optimistic versions, explicit publication and recoverable loading/conflict errors. Provider credentials, real business identity and live publication remain separate deployment configuration; no fabricated live customer data or legal identity is added.
