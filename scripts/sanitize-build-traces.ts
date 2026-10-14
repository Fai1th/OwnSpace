import { lstat, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateVercelOutput } from "./validate-vercel-output";

const PRIVATE_ROOTS = new Set([
  ".ownspace-data",
  "work",
  ".work",
  ".git",
  ".vercel",
  "test-results",
  "playwright-report",
]);
function inside(root: string, target: string) {
  const relative = path.relative(root, target);
  return relative !== ".." && !relative.startsWith(".." + path.sep) && !path.isAbsolute(relative);
}
async function regular(target: string, directory = false) {
  const info = await lstat(target);
  if (info.isSymbolicLink() || (directory ? !info.isDirectory() : !info.isFile()))
    throw new Error("Trace artifacts must be regular files and directories, without links.");
}
function privateReference(root: string, trace: string, entry: string) {
  // NFT paths may mix separators on Windows. Interpret both consistently on any OS.
  if (
    !entry ||
    entry.includes("\0") ||
    path.win32.isAbsolute(entry) ||
    path.posix.isAbsolute(entry) ||
    /^[a-z]:/i.test(entry)
  )
    throw new Error("Invalid absolute or empty trace path.");
  const target = path.resolve(path.dirname(trace), ...entry.replace(/\\/g, "/").split("/"));
  if (!inside(root, target)) throw new Error("A trace path escapes the Ownspace project root.");
  const first = path.relative(root, target).split(path.sep)[0];
  const name = process.platform === "win32" ? first.toLowerCase() : first;
  return PRIVATE_ROOTS.has(name) || name.startsWith(".env");
}

/** Changes only generated .next NFT manifests; never reads or deletes traced data. */
export async function sanitizeBuildTraces(projectRoot = process.cwd()) {
  const root = await realpath(projectRoot);
  await regular(path.join(root, "package.json"));
  if (JSON.parse(await readFile(path.join(root, "package.json"), "utf8")).name !== "ownspace")
    throw new Error("Trace sanitization requires the Ownspace project root.");
  const build = path.join(root, ".next");
  await regular(build, true);
  try {
    await regular(path.join(build, "BUILD_ID"));
    if (!(await readFile(path.join(build, "BUILD_ID"), "utf8")).trim()) throw new Error();
  } catch {
    throw new Error("Trace sanitization requires a completed Next.js production build.");
  }
  const traces: string[] = [];
  async function collect(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      // Vercel emits a separate output tree with legitimate .func aliases.
      // NFT manifests live at the root and under server; cache/static/output are not inputs.
      if (directory === build && entry.name !== "server" && !entry.name.endsWith(".nft.json"))
        continue;
      const target = path.join(directory, entry.name);
      if (!inside(build, target)) throw new Error("Invalid generated trace path.");
      if (entry.isSymbolicLink()) throw new Error("Linked build artifacts cannot be sanitized.");
      if (entry.isDirectory()) await collect(target);
      else if (entry.name.endsWith(".nft.json")) {
        await regular(target);
        if (!inside(build, await realpath(target)))
          throw new Error("Generated trace path escapes .next.");
        traces.push(target);
      }
    }
  }
  await collect(build);
  if (!traces.length) throw new Error("The production build has no NFT trace manifests.");
  const changes: { file: string; content: string }[] = [];
  let removed = 0;
  // Validate every manifest before making any changes, so malformed data fails closed.
  for (const file of traces) {
    let trace: Record<string, unknown>;
    try {
      trace = JSON.parse(await readFile(file, "utf8"));
    } catch {
      throw new Error("A generated trace is not valid JSON.");
    }
    if (
      !trace ||
      trace.version !== 1 ||
      !Array.isArray(trace.files) ||
      !trace.files.every((entry) => typeof entry === "string")
    )
      throw new Error("Unsupported generated trace format.");
    // Current release builds use Webpack NFT. Alternate-root or symlink metadata
    // needs explicit support before it can be safely filtered or deployed.
    if ("additionalRoots" in trace || "symlinks" in trace)
      throw new Error("Unsupported trace root or symlink metadata; release validation stopped.");
    if (
      "fileHashes" in trace &&
      (!Array.isArray(trace.fileHashes) ||
        trace.fileHashes.length !== trace.files.length ||
        !trace.fileHashes.every((hash) => typeof hash === "string"))
    )
      throw new Error("Invalid indexed trace file hashes.");
    const retained: number[] = [];
    for (let index = 0; index < trace.files.length; index++)
      if (!privateReference(root, file, trace.files[index])) retained.push(index);
    if (retained.length === trace.files.length) continue;
    removed += trace.files.length - retained.length;
    const files = trace.files;
    trace.files = retained.map((index) => files[index]);
    if (Array.isArray(trace.fileHashes)) {
      const hashes = trace.fileHashes;
      trace.fileHashes = retained.map((index) => hashes[index]);
    }
    changes.push({ file, content: JSON.stringify(trace) });
  }
  // The adapter may have already materialized file maps during onBuildComplete.
  // Validate them separately; changing NFT metadata cannot repair emitted payloads.
  await validateVercelOutput(root);
  for (const change of changes) {
    await regular(change.file);
    if (!inside(build, await realpath(change.file)))
      throw new Error("Generated trace path escapes .next.");
    await writeFile(change.file, change.content);
  }
  return { manifests: traces.length, changed: changes.length, removed };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await sanitizeBuildTraces();
    console.log(
      `Release traces checked: ${result.manifests} manifests; ${result.removed} private references removed.`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Release trace validation failed.");
    process.exitCode = 1;
  }
}
