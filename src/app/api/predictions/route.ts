import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

interface PredictionInput {
  fixtureId: string;
  predictedHome: number;
  predictedAway: number;
}

function isValidScore(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 99;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const inputs: PredictionInput[] = Array.isArray(body?.predictions) ? body.predictions : [];

  const valid = inputs.filter(
    (p) => typeof p?.fixtureId === "string" && isValidScore(p.predictedHome) && isValidScore(p.predictedAway)
  );

  if (valid.length === 0) {
    return NextResponse.json({ error: "No valid predictions submitted" }, { status: 400 });
  }

  const fixtures = await prisma.fixture.findMany({
    where: { id: { in: valid.map((p) => p.fixtureId) } },
  });
  const fixtureById = new Map(fixtures.map((f) => [f.id, f]));

  const now = new Date();
  let saved = 0;
  let locked = 0;

  for (const p of valid) {
    const fixture = fixtureById.get(p.fixtureId);
    if (!fixture) continue;

    if (now >= fixture.kickoff) {
      locked++;
      continue;
    }

    await prisma.prediction.upsert({
      where: { userId_fixtureId: { userId: session.userId, fixtureId: p.fixtureId } },
      update: { predictedHome: p.predictedHome, predictedAway: p.predictedAway },
      create: {
        userId: session.userId,
        fixtureId: p.fixtureId,
        predictedHome: p.predictedHome,
        predictedAway: p.predictedAway,
      },
    });
    saved++;
  }

  return NextResponse.json({ saved, locked });
}
