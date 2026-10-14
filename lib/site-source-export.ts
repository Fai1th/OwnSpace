import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { strToU8, zipSync } from "fflate";
import { profileSchema } from "./profile";

// Every archive input is a developer-owned constant. Never add request paths,
// directory walks, app routes, account services or environment files here.
export const SITE_EXPORT_SOURCE_FILES = [
  "components/profile-view.tsx",
  "components/site-canvas.tsx",
  "components/site-canvas.css",
  "components/website-blocks.tsx",
  "components/website-blocks.css",
  "components/premium-elements/index.tsx",
  "components/premium-elements/shared.tsx",
  "components/premium-elements/content.tsx",
  "components/premium-elements/media.tsx",
  "components/premium-elements/interactive.tsx",
  "components/premium-elements/motion.tsx",
  "components/premium-elements/premium-elements.css",
  "lib/profile.ts",
  "lib/site-safety.ts",
  "lib/site-settings.ts",
  "lib/website.ts",
  "lib/premium-elements.ts",
  "lib/plans.ts",
] as const;
const ART_FILES = [
  "avatar-jules.svg",
  "avatar-kai.svg",
  "avatar-noor.svg",
  "avatar-sam.svg",
  "mountain.svg",
  "orbit.svg",
  "sky.svg",
  "still-life.svg",
] as const;
const DEPENDENCIES = [
  "react",
  "react-dom",
  "@fontsource-variable/manrope",
  "@phosphor-icons/react",
  "@radix-ui/react-accordion",
  "@radix-ui/react-tabs",
  "@radix-ui/react-progress",
  "embla-carousel-react",
  "embla-carousel",
  "prism-react-renderer",
  "motion",
  "zod",
] as const;
const TYPE_DEPENDENCIES = [
  "typescript",
  "@types/react",
  "@types/react-dom",
  "@types/node",
] as const;
const LICENSE_FILES = [
  ["react", "LICENSE", "react"],
  ["react-dom", "LICENSE", "react-dom"],
  ["@fontsource-variable/manrope", "LICENSE", "manrope"],
  ["@phosphor-icons/react", "LICENSE", "phosphor-icons-react"],
  ["@radix-ui/react-accordion", "LICENSE", "radix-accordion"],
  ["@radix-ui/react-tabs", "LICENSE", "radix-tabs"],
  ["@radix-ui/react-progress", "LICENSE", "radix-progress"],
  ["prism-react-renderer", "LICENSE", "prism-react-renderer"],
  ["motion", "LICENSE.md", "motion"],
  ["zod", "LICENSE", "zod"],
  ["typescript", "LICENSE.txt", "typescript"],
  ["typescript", "ThirdPartyNoticeText.txt", "typescript-third-party"],
  ["@types/react", "LICENSE", "types-react"],
  ["@types/react-dom", "LICENSE", "types-react-dom"],
  ["@types/node", "LICENSE", "types-node"],
] as const;

// Embla's npm packages omit their license file. This notice is the MIT license
// published in github.com/davidjerleke/embla-carousel/blob/v8.6.0/LICENSE.
const EMBLA_LICENSE = `MIT License

Copyright (c) David Jerleke.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
const APP_SOURCE = `import { ProfileView } from "./components/profile-view";
import { profileSchema } from "./lib/profile";
import data from "./data.json";
const profile = profileSchema.parse(data);
document.title = profile.displayName;
export default function App() {
  return <main className={profile.site?.mode === "website" ? "exported-site" : "exported-profile"}><ProfileView profile={profile} /></main>;
}
`;
const MAIN_SOURCE = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/manrope";
import "./public-site.css";
import "./export.css";
import App from "./App";
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
`;
const EXPORT_CSS = `html, body, #root { min-height: 100%; }
.exported-profile { width: min(100% - 32px, 560px); margin: 40px auto; }
.exported-site { width: 100%; }
@media (max-width: 600px) { .exported-profile { width: min(100% - 24px, 560px); margin: 16px auto; } }
`;
const README = `# Your Ownspace website

This is a standalone React and TypeScript website exported from your current Ownspace draft.

## Run and edit

Install Node.js 24 LTS, then open this folder in a terminal:

    npm install
    npm run dev

Edit src/data.json to change content, or edit the React components and CSS in src/.
Your page content is data, so punctuation and HTML-looking text are rendered as text.
Uploaded images remain embedded in the JSON; bundled artwork is in public/art/.
External links still point to the destinations you chose.

## Build and host

    npm run build
    npm run preview

Upload the resulting dist/ directory to a static website host. This project uses root-relative
artwork URLs, so host it at the root of a domain or update those URLs for a subdirectory.
Review the page after making changes and keep dependency security updates current.

This export contains the public website renderer, validated content and styles.
The Ownspace editor, hosted publishing, accounts, billing, analytics and account settings
are separate services and are not included. Third-party licenses are in licenses/ and
THIRD-PARTY-NOTICES.md. Your content retains its existing rights.
`;

/** Refuse symlinks and any path outside the source root, including parent links. */
async function readAllowlisted(root: string, relative: string) {
  const segments = relative.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === ".."))
    throw new Error("Invalid source export path.");
  let current = root;
  for (let i = 0; i < segments.length; i++) {
    current = path.join(current, segments[i]);
    const info = await lstat(current);
    if (info.isSymbolicLink() || (i < segments.length - 1 ? !info.isDirectory() : !info.isFile()))
      throw new Error("Source export files must be regular files.");
  }
  const resolved = await realpath(current);
  const relativeResolved = path.relative(root, resolved);
  if (relativeResolved.startsWith("..") || path.isAbsolute(relativeResolved))
    throw new Error("Source export path is outside the project.");
  return new Uint8Array(await readFile(resolved));
}

/** The optional root is for trusted build/test callers only, never request input. */
export async function buildSiteSourceExport(input: unknown, sourceRoot = process.cwd()) {
  // Re-parse even if the API already validated: unknown/account fields are stripped.
  const profile = profileSchema.parse(input);
  const root = await realpath(sourceRoot);
  const files: Record<string, Uint8Array> = {};
  for (const source of SITE_EXPORT_SOURCE_FILES)
    files[`src/${source}`] = await readAllowlisted(root, source);
  files["src/public-site.css"] = await readAllowlisted(root, "app/globals.css");
  for (const art of ART_FILES)
    files[`public/art/${art}`] = await readAllowlisted(root, `public/art/${art}`);
  const versions: Record<string, string> = {};
  for (const name of [...DEPENDENCIES, ...TYPE_DEPENDENCIES]) {
    const meta = JSON.parse(
      new TextDecoder().decode(await readAllowlisted(root, `node_modules/${name}/package.json`)),
    );
    if (typeof meta.version !== "string" || !/^\d+\.\d+\.\d+$/.test(meta.version))
      throw new Error("An export dependency needs a stable installed version.");
    versions[name] = meta.version;
  }
  for (const [name, license, target] of LICENSE_FILES)
    files[`licenses/${target}.txt`] = await readAllowlisted(
      root,
      `node_modules/${name}/${license}`,
    );
  files["licenses/embla-carousel.txt"] = strToU8(EMBLA_LICENSE);
  const dependencyMap = (names: readonly string[]) =>
    Object.fromEntries(names.map((name) => [name, versions[name]]));
  const generated: Record<string, string> = {
    "package.json": JSON.stringify(
      {
        name: `ownspace-${profile.handle}`,
        version: "1.0.0",
        private: true,
        type: "module",
        engines: { node: ">=24.0.0" },
        scripts: {
          dev: "vite --host localhost",
          build: "tsc --noEmit && vite build",
          preview: "vite preview --host localhost",
        },
        dependencies: dependencyMap(DEPENDENCIES),
        devDependencies: {
          ...dependencyMap(TYPE_DEPENDENCIES),
          vite: "8.3.4",
          "@vitejs/plugin-react": "6.1.2",
        },
      },
      null,
      2,
    ),
    "index.html":
      '<!doctype html>\n<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>My website</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n',
    "vite.config.ts":
      'import { fileURLToPath, URL } from "node:url";\nimport { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nexport default defineConfig({ plugins: [react()], resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } } });\n',
    "tsconfig.json": JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          module: "ESNext",
          moduleResolution: "Bundler",
          jsx: "react-jsx",
          strict: true,
          skipLibCheck: true,
          noEmit: true,
          resolveJsonModule: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          isolatedModules: true,
          baseUrl: ".",
          paths: { "@/*": ["src/*"] },
          types: ["vite/client", "node"],
        },
        include: ["src", "vite.config.ts"],
      },
      null,
      2,
    ),
    "src/main.tsx": MAIN_SOURCE,
    "src/App.tsx": APP_SOURCE,
    "src/export.css": EXPORT_CSS,
    "src/data.json": JSON.stringify(profile, null, 2),
    "README.md": README,
    "THIRD-PARTY-NOTICES.md":
      "# Source and third-party notices\n\nThe public renderer and styles were exported from Ownspace. Your page content retains its existing rights.\n\nDirect dependencies and installed versions:\n\n" +
      [...DEPENDENCIES, ...TYPE_DEPENDENCIES]
        .map((name) => `- ${name} ${versions[name]}`)
        .join("\n") +
      "\n\nLicense texts distributed with installed public libraries are reproduced in licenses/. Embla's MIT notice is reproduced from its v8.6.0 repository because its npm packages omit that file. Manrope uses the SIL Open Font License. TypeScript uses Apache 2.0. The other listed packages use MIT.\n\nVite 8.3.4 and @vitejs/plugin-react 6.1.2 are MIT-licensed build tools installed by npm. Their package distributions include their licenses; retain those notices when redistributing the tools. Transitive dependencies retain their own license notices after npm install.\n",
  };
  for (const [name, content] of Object.entries(generated)) files[name] = strToU8(content);
  return zipSync(files, { level: 6 });
}
