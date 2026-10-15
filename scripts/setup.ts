import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { deploymentIssues } from "../lib/deployment";
import { Pool } from "pg";
loadEnvConfig(process.cwd());
const production = process.argv.includes("--production");
const missing = deploymentIssues(process.env);
if (missing.length) {
  console.log("Configuration still needed:\n" + missing.map((k) => " - " + k).join("\n"));
  if (production) process.exit(1);
}
if (process.env.DATABASE_URL) {
  const { schemaSql } = await import("../lib/repository");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  try {
    await pool.query(schemaSql);
    console.log("Database schema ready.");
  } finally {
    await pool.end();
  }
}
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PREMIUM_PRICE_ID) {
  const { stripeClient, assertPremiumPrice } = await import("../lib/billing");
  const price = await stripeClient().prices.retrieve(process.env.STRIPE_PREMIUM_PRICE_ID);
  assertPremiumPrice(price);
  console.log("Stripe price matches configuration.");
}
console.log(
  missing.length
    ? "Local preview is available; production configuration is incomplete."
    : "Required configuration present. Finish provider dashboard configuration in README. No secret values were printed.",
);
