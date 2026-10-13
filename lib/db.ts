import { Repository, schemaSql, type Db, type QueryDb } from "./repository";
import path from "node:path";
let repository: Promise<Repository> | undefined;
export function getRepository() {
  if (!repository)
    repository = connect().catch((e) => {
      repository = undefined;
      throw e;
    });
  return repository;
}
async function connect() {
  let db: Db;
  if (process.env.DATABASE_URL) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
    db = {
      query: async (s, p) => await pool.query(s, p),
      transaction: async (fn) => {
        const c = await pool.connect();
        try {
          await c.query("BEGIN");
          const out = await fn({ query: async (s, p) => c.query(s, p) });
          await c.query("COMMIT");
          return out;
        } catch (e) {
          await c.query("ROLLBACK");
          throw e;
        } finally {
          c.release();
        }
      },
    };
    await db.query(schemaSql);
  } else {
    if (process.env.NODE_ENV === "production" && process.env.OWNSPACE_LOCAL_PREVIEW !== "1")
      throw new Error("DATABASE_URL is required for production.");
    const { PGlite } = await import("@electric-sql/pglite");
    const embedded = new PGlite(
      process.env.LOCAL_DATABASE_PATH || path.join(process.cwd(), ".ownspace-data"),
    );
    await embedded.exec(schemaSql);
    db = {
      query: async (s, p) => embedded.query(s, p),
      transaction: async (fn) =>
        embedded.transaction(async (tx) => fn({ query: async (s, p) => tx.query(s, p) })),
    };
  }
  return new Repository(db);
}
