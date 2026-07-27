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
  const wildcardFixtureId: string | null = typeof body?.wildcardFixtureId === "string" ? body.wildcardFixtureId : null;

  const valid = inputs.filter(
    (p) => typeof p?.fixtureId === "string" && isValidScore(p.predictedHome) && isValidScore(p.predictedAway)
  );

  if (valid.length === 0 && !wildcardFixtureId) {
    return NextResponse.json({ error: "No valid predictions submitted" }, { status: 400 });
  }

  const fixtureIdsToLoad = new Set(valid.map((p) => p.fixtureId));
  if (wildcardFixtureId) fixtureIdsToLoad.add(wildcardFixtureId);

  const fixtures = await prisma.fixture.findMany({ where: { id: { in: [...fixtureIdsToLoad] } } });
  const fixtureById = new Map(fixtures.map((f) => [f.id, f]));

  // Predictions (and the wildcard pick) lock for the whole round as soon as its first fixture
  // kicks off, not just the individual fixture being edited — so we need every round's earliest
  // kickoff, not just the kickoff of the fixtures being submitted right now.
  const roundIds = [...new Set(fixtures.map((f) => f.roundId))];
  const roundFixtures = await prisma.fixture.findMany({
    where: { roundId: { in: roundIds } },
    select: { id: true, roundId: true, kickoff: true },
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

  // Only one wildcard per round: clear it on every other fixture in that round before (or
  // instead of) setting the new one. A missing/null wildcardFixtureId means "no wildcard this
  // round" and clears whatever was previously selected.
  let wildcardSaved = false;
  for (const roundId of roundIds) {
    const roundLocksAt = earliestKickoffByRound.get(roundId);
    if (roundLocksAt !== undefined && now >= roundLocksAt) continue;

    const siblingIds = roundFixtures.filter((f) => f.roundId === roundId).map((f) => f.id);
    await prisma.prediction.updateMany({
      where: { userId: session.userId, fixtureId: { in: siblingIds } },
      data: { isWildcard: false },
    });

    if (wildcardFixtureId && fixtureById.get(wildcardFixtureId)?.roundId === roundId) {
      const result = await prisma.prediction.updateMany({
        where: { userId: session.userId, fixtureId: wildcardFixtureId },
        data: { isWildcard: true },
      });
      wildcardSaved = result.count > 0;
    }
  }

  return NextResponse.json({ saved, locked, wildcardSaved });
}
