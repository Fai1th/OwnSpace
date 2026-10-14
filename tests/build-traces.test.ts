import { beforeEach, afterEach, expect, it } from "vitest";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { sanitizeBuildTraces } from "../scripts/sanitize-build-traces";
let root: string;
const work = path.resolve("work");
beforeEach(async () => {
  await mkdir(work, { recursive: true });
  root = await mkdtemp(path.join(work, "trace-sanitizer-"));
  await mkdir(path.join(root, ".next/server/app/api/site-export"), { recursive: true });
  await writeFile(path.join(root, "package.json"), '{"name":"ownspace","type":"module"}');
  await writeFile(path.join(root, ".next/BUILD_ID"), "fixture-build");
});
afterEach(async () => {
  if (!root.startsWith(work + path.sep)) throw new Error("Unsafe fixture cleanup path.");
  await rm(root, { recursive: true, force: true });
});
async function manifest(relative: string, value: unknown) {
  const file = path.join(root, ".next", relative);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value));
  return file;
}
it("removes private root references with either separator while preserving libraries and ZIP sources verbatim", async () => {
  const retained = [
    "../../../../../node_modules/next/dist/server/next-server.js",
    "..\\..\\..\\..\\..\\components\\site-canvas.tsx",
    "../../../../../lib/profile.ts",
    "../../../../../public/art/sky.svg",
    "../../../../../node_modules/package/work/runtime.js",
    "../../../../../node_modules/package/.env.example",
    "../../../../../components/work/card.tsx",
    "../../../chunks/123.js",
    "route_client-reference-manifest.js",
  ];
  const privateEntries = [
    "../../../../../.ownspace-data/base/1/123",
    "..\\..\\..\\..\\..\\work\\export.zip",
    "../../../../../.git/HEAD",
    "../../../../../.vercel/project.json",
    "../../../../../test-results/report.json",
    "../../../../../playwright-report/index.html",
    "../../../../../.env",
    "..\\..\\..\\..\\..\\.env.local",
    "../../../../../.env.production",
    "../../../../../work/../.ownspace-data/PG_VERSION",
    "../../../../../.work/node-compile-cache/file",
  ];
  const file = await manifest("server/app/api/site-export/route.js.nft.json", {
    version: 1,
    files: [...privateEntries, ...retained],
    fixture: "preserve metadata",
  });
  const unrelated = path.join(root, ".next/keep.json");
  await writeFile(unrelated, "untouched");
  expect(await sanitizeBuildTraces(root)).toEqual({ manifests: 1, changed: 1, removed: 11 });
  expect(JSON.parse(await readFile(file, "utf8"))).toEqual({
    version: 1,
    files: retained,
    fixture: "preserve metadata",
  });
  expect(await readFile(unrelated, "utf8")).toBe("untouched");
  expect(await sanitizeBuildTraces(root)).toEqual({ manifests: 1, changed: 0, removed: 0 });
});
it("handles root and nested traces without deleting or reading the private files they reference", async () => {
  await mkdir(path.join(root, ".ownspace-data"));
  const database = path.join(root, ".ownspace-data/PG_VERSION");
  await writeFile(database, "private database fixture stays on disk");
  const first = await manifest("next-server.js.nft.json", {
    version: 1,
    files: ["../.ownspace-data/PG_VERSION", "../node_modules/next/package.json"],
  });
  const second = await manifest("server/app/api/site-export/route.js.nft.json", {
    version: 1,
    files: ["../../../../../work/page.zip", "../../../../../components/profile-view.tsx"],
  });
  expect(await sanitizeBuildTraces(root)).toEqual({ manifests: 2, changed: 2, removed: 2 });
  expect(JSON.parse(await readFile(first, "utf8")).files).toEqual([
    "../node_modules/next/package.json",
  ]);
  expect(JSON.parse(await readFile(second, "utf8")).files).toEqual([
    "../../../../../components/profile-view.tsx",
  ]);
  expect(await readFile(database, "utf8")).toBe("private database fixture stays on disk");
});
it.each([
  "../../../../../../outside/private.txt",
  "D:\\outside\\private.txt",
  "/outside/private.txt",
  "\\\\server\\share\\private.txt",
  "D:relative.txt",
  "bad\u0000path",
])("fails closed for invalid trace path %j before modifying any manifests", async (entry) => {
  const first = await manifest("first.nft.json", { version: 1, files: ["../.env.local"] });
  await manifest("last.nft.json", { version: 1, files: [entry] });
  const original = await readFile(first, "utf8");
  await expect(sanitizeBuildTraces(root)).rejects.toThrow(/path/i);
  expect(await readFile(first, "utf8")).toBe(original);
});
it.each([
  { version: 1, files: [1] },
  { version: 2, files: [] },
  { version: 1, files: null },
  { version: 1, files: [], additionalRoots: [] },
  { version: 1, files: [], symlinks: {} },
])("rejects unsupported or malformed trace data before rewriting it", async (value) => {
  const file = await manifest("invalid.nft.json", value);
  const original = await readFile(file, "utf8");
  await expect(sanitizeBuildTraces(root)).rejects.toThrow(/trace/i);
  expect(await readFile(file, "utf8")).toBe(original);
});
it("preserves parallel file hashes when removing their private entries", async () => {
  const file = await manifest("hashes.nft.json", {
    version: 1,
    files: ["../.env", "../package.json"],
    fileHashes: ["private-hash", "public-hash"],
  });
  await sanitizeBuildTraces(root);
  expect(JSON.parse(await readFile(file, "utf8"))).toEqual({
    version: 1,
    files: ["../package.json"],
    fileHashes: ["public-hash"],
  });
});
it("refuses a different project, incomplete build or linked build directory", async () => {
  await manifest("valid.nft.json", { version: 1, files: [] });
  await writeFile(path.join(root, "package.json"), '{"name":"another-project"}');
  await expect(sanitizeBuildTraces(root)).rejects.toThrow(/Ownspace/i);
  await writeFile(path.join(root, "package.json"), '{"name":"ownspace"}');
  await rm(path.join(root, ".next/BUILD_ID"));
  await expect(sanitizeBuildTraces(root)).rejects.toThrow(/build/i);
  const linkedRoot = await mkdtemp(path.join(work, "trace-link-"));
  try {
    await writeFile(path.join(linkedRoot, "package.json"), '{"name":"ownspace"}');
    await symlink(path.join(root, ".next"), path.join(linkedRoot, ".next"), "junction");
    await expect(sanitizeBuildTraces(linkedRoot)).rejects.toThrow(/link|regular/i);
  } finally {
    if (!linkedRoot.startsWith(work + path.sep)) throw new Error("Unsafe fixture cleanup path.");
    await rm(linkedRoot, { recursive: true, force: true });
  }
});
it("ignores Vercel emitted function aliases and non-runtime build directories", async () => {
  const file = await manifest("server/app/page.js.nft.json", {
    version: 1,
    files: ["../../../work/private.zip", "../../../components/site-canvas.tsx"],
  });
  const output = path.join(root, ".next/output/functions");
  await mkdir(path.join(output, "index.func"), { recursive: true });
  await writeFile(
    path.join(output, "index.func/.vc-config.json"),
    JSON.stringify({ filePathMap: { "components/site-canvas.tsx": "components/site-canvas.tsx" } }),
  );
  await symlink(path.join(output, "index.func"), path.join(output, "page.func"), "junction");
  const ignored = await manifest("cache/unrelated.nft.json", { invalid: "not a runtime manifest" });
  expect(await sanitizeBuildTraces(root)).toEqual({ manifests: 1, changed: 1, removed: 1 });
  expect(JSON.parse(await readFile(file, "utf8")).files).toEqual([
    "../../../components/site-canvas.tsx",
  ]);
  expect(JSON.parse(await readFile(ignored, "utf8"))).toEqual({
    invalid: "not a runtime manifest",
  });
});
it("rejects private already-emitted Vercel assets before rewriting any NFT metadata", async () => {
  const file = await manifest("server/app/page.js.nft.json", {
    version: 1,
    files: ["../../../work/private.zip"],
  });
  const original = await readFile(file, "utf8");
  const output = path.join(root, ".next/output/functions/index.func");
  await mkdir(output, { recursive: true });
  await writeFile(
    path.join(output, ".vc-config.json"),
    JSON.stringify({ filePathMap: { "data.zip": "work/private.zip" } }),
  );
  await expect(sanitizeBuildTraces(root)).rejects.toThrow(/private/i);
  expect(await readFile(file, "utf8")).toBe(original);
});
