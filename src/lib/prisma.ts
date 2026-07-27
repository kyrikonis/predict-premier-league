import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Force the Postgres session to UTC. Prisma 7's driver-adapter query engine mis-parses
// `timestamptz` values (drops the offset instead of converting it) whenever the session's
// timezone isn't UTC — verified directly against this database: a plain `pg` client parses the
// same value correctly regardless of session timezone, only Prisma's engine gets it wrong. This
// makes correctness independent of whatever the database's default timezone happens to be.
const connectionString = `${process.env.DATABASE_URL}${
  process.env.DATABASE_URL?.includes("?") ? "&" : "?"
}options=-c%20TimeZone%3DUTC`;

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
