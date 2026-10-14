import { beforeEach, afterEach, expect, it } from "vitest";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { validateVercelOutput } from "../scripts/validate-vercel-output";
let root: string;
const work = path.resolve("work");
beforeEach(async () => {
  await mkdir(work, { recursive: true });
  root = await mkdtemp(path.join(work, "vercel-output-test-"));
});
afterEach(async () => {
  if (!root.startsWith(work + path.sep)) throw new Error("Unsafe fixture cleanup.");
  await rm(root, { recursive: true, force: true });
});
async function config(name: string, value: unknown) {
  const file = path.join(root, ".next/output/functions", name, ".vc-config.json");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value));
  return file;
}
it("returns zero for a normal Next build without Vercel output", async () => {
  expect(await validateVercelOutput(root)).toBe(0);
  await mkdir(path.join(root, ".next"));
  expect(await validateVercelOutput(root)).toBe(0);
});
it("validates real Node and Edge asset-map shapes and skips internal function aliases without changing files", async () => {
  const node = await config("api/site-export.func", {
    runtime: "nodejs24.x",
    handler: "___next_launcher.cjs",
    filePathMap: {
      ".next/server/app/api/site-export/route.js": ".next/server/app/api/site-export/route.js",
      "components/site-canvas.tsx": "components/site-canvas.tsx",
      "node_modules/package/work/runtime.js": "node_modules/package/work/runtime.js",
      "node_modules/package/.env.example": "node_modules/package/.env.example",
      "public/art/sky.svg": "public/art/sky.svg",
    },
  });
  const edge = await config("middleware.func", {
    runtime: "edge",
    entrypoint: "index.js",
    filePathMap: { "assets/node_modules/pkg/a.wasm": "node_modules/pkg/a.wasm" },
  });
  await symlink(
    path.dirname(edge),
    path.join(root, ".next/output/functions/alias.func"),
    "junction",
  );
  const before = await readFile(node, "utf8");
  expect(await validateVercelOutput(root)).toBe(2);
  expect(await readFile(node, "utf8")).toBe(before);
});
it.each([
  ".env",
  ".env.local",
  ".env.production",
  ".ownspace-data/base/1/123",
  "work/export.zip",
  ".work/node-compile-cache/file",
  ".git/HEAD",
  ".vercel/project.json",
  "test-results/report.json",
  "playwright-report/index.html",
  "work/../.env.local",
])("rejects private mapped sources %s without reading the referenced data", async (source) => {
  // The referenced file does not exist. Validation must inspect the map, not read it.
  await config("api/profile.func", {
    runtime: "nodejs24.x",
    filePathMap: { "innocent-name.txt": source },
  });
  await expect(validateVercelOutput(root)).rejects.toThrow(/private/i);
});
it("checks destination keys and normalizes Windows separators as well as source values", async () => {
  const file = await config("api/profile.func", {
    filePathMap: { ".git/HEAD": "public/safe.txt" },
  });
  await expect(validateVercelOutput(root)).rejects.toThrow(/private/i);
  await writeFile(
    file,
    JSON.stringify({ filePathMap: { "safe.txt": ".work\\node-compile-cache\\file" } }),
  );
  await expect(validateVercelOutput(root)).rejects.toThrow(/private/i);
});
it.each([
  "/outside.txt",
  "D:\\outside.txt",
  "D:relative.txt",
  "\\\\host\\share\\file",
  "bad\u0000path",
  "",
])("rejects unsafe map paths %j", async (source) => {
  await config("api/profile.func", { filePathMap: { "safe.txt": source } });
  await expect(validateVercelOutput(root)).rejects.toThrow(/path/i);
});
it.each([{}, { filePathMap: null }, { filePathMap: [] }, { filePathMap: { a: 1 } }])(
  "fails closed for malformed function config",
  async (value) => {
    await config("api/profile.func", value);
    await expect(validateVercelOutput(root)).rejects.toThrow(/config|map/i);
  },
);
it("rejects a function alias escaping the output tree", async () => {
  await config("real.func", { filePathMap: {} });
  const outside = path.join(root, "outside.func");
  await mkdir(outside);
  await symlink(outside, path.join(root, ".next/output/functions/escape.func"), "junction");
  await expect(validateVercelOutput(root)).rejects.toThrow(/link|alias/i);
});
it("rejects linked config files or container directories rather than following them", async () => {
  const file = await config("api/profile.func", { filePathMap: {} });
  await rm(file);
  // A junction can replace a config path without requiring Windows symlink privileges.
  await symlink(root, file, "junction");
  await expect(validateVercelOutput(root)).rejects.toThrow(/link|regular/i);
});

it("preserves trusted external framework sources represented relative to the repository root", async () => {
  await config("api/external.func", {
    runtime: "nodejs24.x",
    filePathMap: {
      ".next/server/framework-handler.js":
        "../../../.npm-cache/_npx/hash/node_modules/@vercel/next/dist/server/node-handler.js",
    },
  });
  expect(await validateVercelOutput(root)).toBe(1);
});
it("rejects a relative source that exits and then reenters a project-private root", async () => {
  await config("api/reentry.func", {
    filePathMap: { "safe.txt": `../${path.basename(root)}/.env.local` },
  });
  await expect(validateVercelOutput(root)).rejects.toThrow(/private/i);
});
