import { expect, it } from "vitest";
import { spawnSync } from "node:child_process";
function preflight(strict = false) {
  return spawnSync(
    process.execPath,
    [
      "node_modules/tsx/dist/cli.mjs",
      "scripts/validate-deployment.ts",
      ...(strict ? ["--strict"] : []),
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        OWNSPACE_LOCAL_PREVIEW: "0",
        NEXT_PUBLIC_LEGAL_OPERATOR: "",
        DATABASE_URL: "",
      },
      timeout: 15000,
    },
  );
}
it("permits compilation with incomplete launch configuration and reports missing names", () => {
  const result = preflight();
  expect(result.status).toBe(0);
  expect(result.stdout + result.stderr).toContain("NEXT_PUBLIC_LEGAL_OPERATOR");
});
it("still fails explicit production readiness validation when required details are absent", () => {
  expect(preflight(true).status).toBe(1);
});
