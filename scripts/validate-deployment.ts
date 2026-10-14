import nextEnv from "@next/env";
import { deploymentIssues } from "../lib/deployment";
nextEnv.loadEnvConfig(process.cwd());
const issues = deploymentIssues(process.env);
if (issues.length) {
  console.warn(
    "Public launch configuration is incomplete:\n" + issues.map((name) => " - " + name).join("\n"),
  );
  if (process.argv.includes("--strict")) process.exit(1);
  console.warn(
    "Compilation can continue. Hosted accounts, publishing and purchases remain unavailable until setup is complete.",
  );
} else
  console.log(
    "Required launch configuration is present. Provider dashboard setup still needs verification.",
  );
