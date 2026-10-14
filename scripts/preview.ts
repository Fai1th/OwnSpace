import { spawnSync } from "node:child_process";
import path from "node:path";
import { sanitizeBuildTraces } from "./sanitize-build-traces";
const mode = process.argv[2];
if (mode !== "build" && mode !== "start") throw Error("Use build or start.");
const out = spawnSync(
  process.execPath,
  [
    path.join(process.cwd(), "node_modules/next/dist/bin/next"),
    mode,
    ...(mode === "build" ? ["--webpack"] : ["--hostname", "localhost"]),
    ...process.argv.slice(3),
  ],
  {
    stdio: "inherit",
    env: { ...process.env, OWNSPACE_LOCAL_PREVIEW: "1", NEXT_TELEMETRY_DISABLED: "1" },
  },
);
if (out.status !== 0) process.exit(out.status ?? 1);
if (mode === "build") {
  const result = await sanitizeBuildTraces();
  console.log(
    `Release traces checked: ${result.manifests} manifests; ${result.removed} private references removed.`,
  );
}
process.exit(0);
