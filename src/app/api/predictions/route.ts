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

  // Predictions lock for the whole round as soon as its first fixture kicks off, not just the
  // individual fixture being edited — so we need every round's earliest kickoff, not just the
  // kickoff of the fixtures being submitted right now.
  const roundIds = [...new Set(fixtures.map((f) => f.roundId))];
  const roundFixtures = await prisma.fixture.findMany({
    where: { roundId: { in: roundIds } },
    select: { roundId: true, kickoff: true },
  });
  const earliestKickoffByRound = new Map<string, number>();
  for (const f of roundFixtures) {
    const t = f.kickoff.getTime();
    const current = earliestKickoffByRound.get(f.roundId);
    if (current === undefined || t < current) earliestKickoffByRound.set(f.roundId, t);
  }

  const now = Date.now();
  let saved = 0;
  let locked = 0;

  for (const p of valid) {
    const fixture = fixtureById.get(p.fixtureId);
    if (!fixture) continue;

    const roundLocksAt = earliestKickoffByRound.get(fixture.roundId);
    if (roundLocksAt !== undefined && now >= roundLocksAt) {
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
