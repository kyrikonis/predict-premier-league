import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/password";

const USERNAME_PATTERN = /^[a-zA-Z0-9 _-]{2,20}$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const rawUsername = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!USERNAME_PATTERN.test(rawUsername)) {
    return NextResponse.json(
      { error: "Username must be 2-20 characters (letters, numbers, spaces, - or _)." },
      { status: 400 }
    );
  }

  if (password.length === 0) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  const usernameLower = rawUsername.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { usernameLower } });
  if (existing) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { username: rawUsername, usernameLower, passwordHash },
  });

  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  await session.save();

  return NextResponse.json({ username: user.username });
}
