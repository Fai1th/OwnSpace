import { expect, it } from "vitest";
import path from "node:path";
import { mkdir, mkdtemp, rm, symlink } from "node:fs/promises";
import ts from "typescript";
import { unzipSync, strFromU8 } from "fflate";
import { emptyProfile } from "../lib/profile";
import { buildSiteSourceExport } from "../lib/site-source-export";

it("exports a standalone project and keeps page text in JSON rather than executable source", async () => {
  const profile = {
    ...emptyProfile,
    handle: "export-test",
    displayName: "</title><script>alert(1)</script>",
    bio: 'A quote " and a backtick ` and ${process.env.SECRET}',
  };
  const zip = unzipSync(
    await buildSiteSourceExport({
      ...profile,
      owner: "private-owner",
      entitlement: "paid",
      secret: "DO_NOT_EXPORT",
    }),
  );
  expect(Object.keys(zip)).toEqual(
    expect.arrayContaining([
      "package.json",
      "index.html",
      "vite.config.ts",
      "tsconfig.json",
      "README.md",
      "THIRD-PARTY-NOTICES.md",
      "src/main.tsx",
      "src/App.tsx",
      "src/data.json",
      "src/components/profile-view.tsx",
      "src/components/site-canvas.tsx",
      "src/components/website-blocks.tsx",
      "src/lib/profile.ts",
      "src/lib/website.ts",
      "src/public-site.css",
      "public/art/sky.svg",
      "licenses/react.txt",
      "licenses/react-dom.txt",
      "licenses/manrope.txt",
    ]),
  );
  expect(JSON.parse(strFromU8(zip["src/data.json"]))).toEqual(profile);
  expect(strFromU8(zip["index.html"])).not.toContain(profile.displayName);
  expect(strFromU8(zip["src/App.tsx"])).not.toContain(profile.bio);
  const combined = Object.values(zip)
    .map((file) => strFromU8(file))
    .join("\n");
  expect(combined).not.toContain("DO_NOT_EXPORT");
  expect(combined).not.toContain("private-owner");
  expect(
    Object.keys(zip).some((name) =>
      /(?:^|\/)(?:\.env|\.git|api|server|db|billing|clerk|config\.ts|node_modules)(?:[/.]|$)/i.test(
        name,
      ),
    ),
  ).toBe(false);
  const pkg = JSON.parse(strFromU8(zip["package.json"]));
  expect(pkg.scripts.build).toBe("tsc --noEmit && vite build");
  for (const forbidden of ["next", "@clerk/nextjs", "@puckeditor/core", "stripe", "pg"])
    expect(pkg.dependencies).not.toHaveProperty(forbidden);
  for (const [name, bytes] of Object.entries(zip)) {
    if (!/\.tsx?$/.test(name)) continue;
    for (const imported of ts.preProcessFile(strFromU8(bytes), true, true).importedFiles) {
      const specifier = imported.fileName;
      if (specifier === "node:url") continue;
      if (specifier.startsWith(".") || specifier.startsWith("@/")) {
        const target = specifier.startsWith("@/")
          ? `src/${specifier.slice(2)}`
          : path.posix.normalize(path.posix.join(path.posix.dirname(name), specifier));
        expect(
          [target, `${target}.ts`, `${target}.tsx`, `${target}/index.tsx`].some(
            (candidate) => candidate in zip,
          ),
          `${name} imports missing ${specifier}`,
        ).toBe(true);
      } else {
        const packageName = specifier.startsWith("@")
          ? specifier.split("/").slice(0, 2).join("/")
          : specifier.split("/")[0];
        expect(
          { ...pkg.dependencies, ...pkg.devDependencies },
          `${name} imports undeclared ${specifier}`,
        ).toHaveProperty(packageName);
      }
    }
  }
  for (const version of Object.values({ ...pkg.dependencies, ...pkg.devDependencies }))
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
});

it("validates untrusted profile content before creating an archive", async () => {
  await expect(buildSiteSourceExport({ ...emptyProfile, avatar: "/../../.env" })).rejects.toThrow();
  await expect(
    buildSiteSourceExport({
      ...emptyProfile,
      links: [{ id: "bad", title: "Bad", url: "javascript:alert(1)", enabled: true }],
    }),
  ).rejects.toThrow();
});

it("refuses an allowlisted source directory replaced by a filesystem link", async () => {
  const work = path.resolve("work");
  await mkdir(work, { recursive: true });
  const fixture = await mkdtemp(path.join(work, "export-boundary-"));
  try {
    await symlink(path.resolve("components"), path.join(fixture, "components"), "junction");
    await expect(buildSiteSourceExport(emptyProfile, fixture)).rejects.toThrow(/regular files/);
  } finally {
    if (!fixture.startsWith(work + path.sep)) throw new Error("Unsafe test cleanup path.");
    await rm(fixture, { recursive: true, force: true });
  }
});
