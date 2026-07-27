import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPremierLeagueMatches } from "@/lib/footballData";
import { formatDateYYYYMMDD } from "@/lib/dates";

const PAD_DAYS = 5;

function isAuthorized(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

/**
 * Fixtures can be rearranged (for TV, postponement, etc.) after we've already selected them
 * for a round. This re-checks the current round's not-yet-finished fixtures daily and updates
 * kickoff times / postponed status to match football-data.org, so prediction locking always
 * reflects the real kickoff time. It also backfills crest/short-name fields when missing (e.g.
 * for fixtures selected before those columns existed).
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const round = await prisma.round.findFirst({
    where: { status: { in: ["UPCOMING", "LOCKED"] } },
    include: { fixtures: true },
  });

  if (!round) {
    return NextResponse.json({ message: "No active round to sync", skipped: true });
  }

  const unfinished = round.fixtures.filter((f) => f.status !== "FINISHED");
  if (unfinished.length === 0) {
    return NextResponse.json({ message: "Nothing to sync", skipped: true });
  }

  const kickoffTimes = unfinished.map((f) => f.kickoff.getTime());
  const dateFrom = new Date(Math.min(...kickoffTimes));
  dateFrom.setUTCDate(dateFrom.getUTCDate() - PAD_DAYS);
  const dateTo = new Date(Math.max(...kickoffTimes));
  dateTo.setUTCDate(dateTo.getUTCDate() + PAD_DAYS);

  const matches = await getPremierLeagueMatches(formatDateYYYYMMDD(dateFrom), formatDateYYYYMMDD(dateTo));
  const matchById = new Map(matches.map((m) => [m.id, m]));

  let updated = 0;

  for (const fixture of unfinished) {
    const match = matchById.get(fixture.externalId);
    if (!match) continue;

    const newKickoff = new Date(match.utcDate);
    const newStatus = ["POSTPONED", "SUSPENDED", "CANCELLED"].includes(match.status) ? "POSTPONED" : "SCHEDULED";
    const crestsMissing = !fixture.homeCrest || !fixture.awayCrest;
    const changed = newKickoff.getTime() !== fixture.kickoff.getTime() || fixture.status !== newStatus || crestsMissing;

    if (changed) {
      await prisma.fixture.update({
        where: { id: fixture.id },
        data: {
          kickoff: newKickoff,
          status: newStatus,
          homeShortName: match.homeTeam.shortName,
          homeCrest: match.homeTeam.crest,
          awayShortName: match.awayTeam.shortName,
          awayCrest: match.awayTeam.crest,
        },
      });
      updated++;
    }
  }

  return NextResponse.json({ round: round.label, checked: unfinished.length, updated });
}
