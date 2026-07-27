import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPremierLeagueMatches } from "@/lib/footballData";
import { formatDateYYYYMMDD } from "@/lib/dates";
import { scorePrediction } from "@/lib/scoring";

function isAuthorized(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const round = await prisma.round.findFirst({
    where: { status: { in: ["UPCOMING", "LOCKED"] } },
    orderBy: { createdAt: "desc" },
    include: { fixtures: { include: { predictions: true } } },
  });

  if (!round) {
    return NextResponse.json({ message: "No round awaiting results", skipped: true });
  }

  const now = new Date();
  const pastKickoffFixtures = round.fixtures.filter((f) => f.kickoff <= now && f.status !== "FINISHED");

  if (pastKickoffFixtures.length === 0) {
    return NextResponse.json({ message: "No fixtures have kicked off yet", skipped: true });
  }

  if (round.status === "UPCOMING") {
    await prisma.round.update({ where: { id: round.id }, data: { status: "LOCKED" } });
  }

  const kickoffTimes = round.fixtures.map((f) => f.kickoff.getTime());
  const dateFrom = formatDateYYYYMMDD(new Date(Math.min(...kickoffTimes)));
  const dateTo = formatDateYYYYMMDD(new Date(Math.max(...kickoffTimes)));
  const matches = await getPremierLeagueMatches(dateFrom, dateTo);
  const matchById = new Map(matches.map((m) => [m.id, m]));

  let scoredFixtures = 0;

  for (const fixture of pastKickoffFixtures) {
    const match = matchById.get(fixture.externalId);
    if (!match) continue;

    if (match.status === "FINISHED" && match.score.fullTime.home != null && match.score.fullTime.away != null) {
      const { home, away } = match.score.fullTime;

      await prisma.fixture.update({
        where: { id: fixture.id },
        data: { homeScore: home, awayScore: away, status: "FINISHED" },
      });

      for (const prediction of fixture.predictions) {
        const points = scorePrediction(prediction.predictedHome, prediction.predictedAway, home, away);
        await prisma.prediction.update({ where: { id: prediction.id }, data: { pointsAwarded: points } });
      }

      scoredFixtures++;
    } else if (["POSTPONED", "SUSPENDED", "CANCELLED"].includes(match.status)) {
      await prisma.fixture.update({ where: { id: fixture.id }, data: { status: "POSTPONED" } });
    }
    // otherwise: match hasn't finished yet (delayed kickoff, still in play) — leave as is, retry next run
  }

  const refreshedRound = await prisma.round.findUnique({ where: { id: round.id }, include: { fixtures: true } });
  const allFinished = refreshedRound?.fixtures.every((f) => f.status === "FINISHED") ?? false;

  if (allFinished) {
    await prisma.round.update({ where: { id: round.id }, data: { status: "COMPLETE" } });
  }

  return NextResponse.json({ round: round.label, scoredFixtures, complete: allFinished });
}
