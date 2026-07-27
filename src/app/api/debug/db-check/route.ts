import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

function isAuthorized(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

async function checkConnection(label: string, connectionString: string | undefined) {
  if (!connectionString) return { label, set: false };

  const start = Date.now();
  const client = new Client({ connectionString, connectionTimeoutMillis: 15000 });
  try {
    await client.connect();
    const connectMs = Date.now() - start;

    const lockStart = Date.now();
    await client.query("select pg_advisory_lock(999111)");
    await client.query("select pg_advisory_unlock(999111)");
    const lockMs = Date.now() - lockStart;

    await client.end();
    return { label, set: true, connectMs, lockOk: true, lockMs };
  } catch (e) {
    await client.end().catch(() => {});
    return { label, set: true, connectMs: Date.now() - start, lockOk: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await Promise.all([
    checkConnection("DATABASE_URL", process.env.DATABASE_URL),
    checkConnection("DATABASE_URL_UNPOOLED", process.env.DATABASE_URL_UNPOOLED),
    checkConnection("POSTGRES_URL_NON_POOLING", process.env.POSTGRES_URL_NON_POOLING),
    checkConnection("POSTGRES_PRISMA_URL", process.env.POSTGRES_PRISMA_URL),
  ]);

  return NextResponse.json(results);
}
