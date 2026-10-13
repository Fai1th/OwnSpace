import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { deploymentIssues } from "../lib/deployment";
loadEnvConfig(process.cwd());
if (process.env.OWNSPACE_LOCAL_PREVIEW !== "1") {
  const issues = deploymentIssues(process.env);
  if (issues.length) {
    console.error(
      "Production configuration is incomplete. Set the following in your deployment environment:\n" +
        issues.map((x) => " - " + x).join("\n"),
    );
    process.exit(1);
  }
} else console.log("Explicit local preview build. Public launch is not configured.");
