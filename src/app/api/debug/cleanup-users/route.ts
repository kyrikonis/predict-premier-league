import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const USERNAMES_TO_REMOVE = ["Dad"];

function isAuthorized(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usernamesLower = USERNAMES_TO_REMOVE.map((u) => u.toLowerCase());
  const users = await prisma.user.findMany({ where: { usernameLower: { in: usernamesLower } } });

  for (const user of users) {
    await prisma.prediction.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }

  return NextResponse.json({ removed: users.map((u) => u.username) });
}
