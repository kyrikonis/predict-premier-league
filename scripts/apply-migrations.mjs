// Prisma's own migration engine (`prisma migrate deploy`) reliably times out acquiring its
// advisory lock in this Vercel build environment against Neon, even though a plain `pg` client
// connects and acquires/releases the same lock in under 20ms (verified via a diagnostic check).
// This applies pending migrations directly with `pg` instead, while writing to the same
// `_prisma_migrations` tracking table Prisma itself uses, so `prisma migrate status`/`deploy`
// stay aware of what's already applied if the underlying engine issue is ever resolved.
import { Client } from "pg";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "prisma", "migrations");

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = new Client({ connectionString });
await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL PRIMARY KEY,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
  );
`);

const { rows: applied } = await client.query(
  `SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`
);
const appliedNames = new Set(applied.map((r) => r.migration_name));

const migrationFolders = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

for (const folder of migrationFolders) {
  if (appliedNames.has(folder)) {
    console.log(`Already applied: ${folder}`);
    continue;
  }

  const sql = readFileSync(join(migrationsDir, folder, "migration.sql"), "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");

  console.log(`Applying migration: ${folder}`);
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query(
      `INSERT INTO "_prisma_migrations"
         (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
       VALUES (gen_random_uuid()::text, $1, $2, now(), now(), 1)`,
      [checksum, folder]
    );
    await client.query("COMMIT");
    console.log(`Applied: ${folder}`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}

await client.end();
console.log("Migrations up to date.");
