import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { Pool } from "pg";
loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) throw Error("Configure DATABASE_URL.");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
try {
  const command = process.argv[2];
  if (command === "list") {
    const result = await pool.query(
      "SELECT id,handle,reason,details,status,created_at FROM reports WHERE status='pending' ORDER BY created_at LIMIT 100",
    );
    console.log(JSON.stringify(result.rows, null, 2));
  } else if (command === "resolve" || command === "unpublish") {
    const id = Number(process.argv[3]);
    if (!Number.isInteger(id) || id < 1) throw Error("Provide a report ID.");
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      const rows = await c.query("SELECT handle FROM reports WHERE id=$1 FOR UPDATE", [id]);
      if (!rows.rows.length) throw Error("Report not found.");
      if (command === "unpublish")
        await c.query("UPDATE profiles SET published=NULL WHERE published->>'handle'=$1", [
          rows.rows[0].handle,
        ]);
      await c.query("UPDATE reports SET status='resolved' WHERE id=$1", [id]);
      await c.query(
        "DELETE FROM handles WHERE handle=$1 AND NOT EXISTS (SELECT 1 FROM profiles WHERE handle=$1)",
        [rows.rows[0].handle],
      );
      await c.query("COMMIT");
      console.log("Report resolved.");
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  } else throw Error("Use list, resolve REPORT_ID, or unpublish REPORT_ID.");
  await pool.query("DELETE FROM rate_limits WHERE expires_at < now() - interval '1 day'");
} finally {
  await pool.end();
}
