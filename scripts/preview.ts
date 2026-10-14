import { spawnSync } from "node:child_process";
import path from "node:path";
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
process.exit(out.status ?? 1);
