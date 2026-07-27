import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { verifyPassword } from "@/lib/password";

const GENERIC_ERROR = "Incorrect username or password.";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const rawUsername = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!rawUsername || !password) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const usernameLower = rawUsername.toLowerCase();
  const user = await prisma.user.findUnique({ where: { usernameLower } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  await session.save();

  return NextResponse.json({ username: user.username });
}
