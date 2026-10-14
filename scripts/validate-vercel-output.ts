import { lstat, readFile, readdir, readlink, realpath } from "node:fs/promises";
import path from "node:path";

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
async function directoryIfPresent(target: string) {
  let info;
  try {
    info = await lstat(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
  if (info.isSymbolicLink() || !info.isDirectory())
    throw new Error("Vercel output directories must be regular directories, without links.");
  return true;
}
function validateMappedPath(root: string, value: unknown) {
  if (
    typeof value !== "string" ||
    !value ||
    value.includes("\0") ||
    path.win32.isAbsolute(value) ||
    path.posix.isAbsolute(value) ||
    /^[a-z]:/i.test(value)
  )
    throw new Error("A Vercel function map contains an invalid relative path.");
  // The adapter uses repoRoot-relative values, not function-directory-relative
  // paths. Legitimate framework files can be outside the repo; do not reject
  // those trusted compiler references solely for containing '..'.
  const resolved = path.resolve(root, ...value.replace(/\\/g, "/").split("/"));
  if (!inside(root, resolved)) return;
  const first = path.relative(root, resolved).split(path.sep)[0];
  const name = process.platform === "win32" ? first.toLowerCase() : first;
  if (PRIVATE_ROOTS.has(name) || name.startsWith(".env"))
    throw new Error("Vercel output references project-private files; release validation stopped.");
}

/** Validate already-emitted Vercel maps; never rewrite maps or read mapped data. */
export async function validateVercelOutput(projectRoot = process.cwd()): Promise<number> {
  const root = await realpath(projectRoot);
  const build = path.join(root, ".next");
  if (!(await directoryIfPresent(build))) return 0;
  const output = path.join(build, "output");
  if (!(await directoryIfPresent(output))) return 0;
  const functions = path.join(output, "functions");
  if (!(await directoryIfPresent(functions))) return 0;
  let checked = 0;
  async function validateConfig(directory: string) {
    const file = path.join(directory, ".vc-config.json");
    const info = await lstat(file);
    if (info.isSymbolicLink() || !info.isFile() || !inside(functions, await realpath(file)))
      throw new Error("A Vercel function config must be a regular file without links.");
    let config: unknown;
    try {
      config = JSON.parse(await readFile(file, "utf8"));
    } catch {
      throw new Error("A Vercel function config contains invalid JSON.");
    }
    if (!config || typeof config !== "object" || Array.isArray(config))
      throw new Error("A Vercel function config must contain a filePathMap.");
    const map = (config as Record<string, unknown>).filePathMap;
    if (!map || typeof map !== "object" || Array.isArray(map))
      throw new Error("A Vercel function config has a malformed filePathMap.");
    for (const [destination, source] of Object.entries(map)) {
      validateMappedPath(root, destination);
      validateMappedPath(root, source);
    }
    checked++;
  }
  async function collect(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (!inside(functions, target))
        throw new Error("A Vercel config path escapes its output root.");
      if (entry.isSymbolicLink()) {
        // Adapter prerender aliases are .func links to regular parent functions.
        // Validate the link boundary, but never traverse it or count it twice.
        const link = await readlink(target);
        const destination = path.resolve(directory, link);
        if (
          !entry.name.endsWith(".func") ||
          !inside(functions, destination) ||
          !destination.endsWith(".func")
        )
          throw new Error("A Vercel function alias link escapes its function tree.");
        const info = await lstat(destination);
        if (
          info.isSymbolicLink() ||
          !info.isDirectory() ||
          !inside(functions, await realpath(destination))
        )
          throw new Error("A Vercel function alias must target a regular function directory.");
        continue;
      }
      if (!entry.isDirectory()) continue;
      if (!(await directoryIfPresent(target)) || !inside(functions, await realpath(target)))
        throw new Error("A Vercel output path escapes its function tree.");
      if (entry.name.endsWith(".func")) await validateConfig(target);
      else await collect(target);
    }
  }
  await collect(functions);
  return checked;
}
