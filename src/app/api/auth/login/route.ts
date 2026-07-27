import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const USERNAME_PATTERN = /^[a-zA-Z0-9 _-]{2,20}$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const rawUsername = typeof body?.username === "string" ? body.username.trim() : "";

  if (!USERNAME_PATTERN.test(rawUsername)) {
    return NextResponse.json(
      { error: "Username must be 2-20 characters (letters, numbers, spaces, - or _)." },
      { status: 400 }
    );
  }

  const usernameLower = rawUsername.toLowerCase();

  const user = await prisma.user.upsert({
    where: { usernameLower },
    update: {},
    create: { username: rawUsername, usernameLower },
  });

  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  await session.save();

  return NextResponse.json({ username: user.username });
}
