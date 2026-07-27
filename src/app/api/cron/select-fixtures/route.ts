import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPremierLeagueMatches, type FootballDataMatch } from "@/lib/footballData";
import { formatDateYYYYMMDD, getSurroundingWeekdays, getUpcomingWeekend, isOnDate } from "@/lib/dates";

const GAMES_PER_ROUND = 6;

function isAuthorized(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { saturday, sunday } = getUpcomingWeekend();

  const existingActiveRound = await prisma.round.findFirst({
    where: { status: { in: ["UPCOMING", "LOCKED"] } },
    include: { fixtures: { take: 1 } },
  });
  if (existingActiveRound?.fixtures[0] && existingActiveRound.fixtures[0].kickoff >= saturday) {
    return NextResponse.json({ message: "An active round already covers the upcoming weekend", skipped: true });
  }

  const weekendMatches = await getPremierLeagueMatches(
    formatDateYYYYMMDD(saturday),
    formatDateYYYYMMDD(sunday)
  );
  const satSunMatches = weekendMatches.filter((m) => isOnDate(m.utcDate, saturday) || isOnDate(m.utcDate, sunday));

  let selected = shuffle(satSunMatches).slice(0, GAMES_PER_ROUND);

  if (selected.length < GAMES_PER_ROUND) {
    const { friday, monday } = getSurroundingWeekdays(saturday, sunday);
    const widerMatches = await getPremierLeagueMatches(formatDateYYYYMMDD(friday), formatDateYYYYMMDD(monday));
    const fridayMondayMatches = widerMatches.filter(
      (m) => isOnDate(m.utcDate, friday) || isOnDate(m.utcDate, monday)
    );
    const extras = shuffle(fridayMondayMatches).slice(0, GAMES_PER_ROUND - selected.length);
    selected = [...selected, ...extras];
  }

  if (selected.length === 0) {
    return NextResponse.json({ message: "No Premier League matches found for the upcoming weekend", skipped: true });
  }

  const label = buildRoundLabel(selected, saturday);

  const round = await prisma.round.create({
    data: {
      label,
      status: "UPCOMING",
      fixtures: {
        create: selected.map((m) => ({
          externalId: m.id,
          homeTeam: m.homeTeam.name,
          awayTeam: m.awayTeam.name,
          kickoff: new Date(m.utcDate),
          status: "SCHEDULED",
        })),
      },
    },
    include: { fixtures: true },
  });

  return NextResponse.json({ round: round.label, fixtureCount: round.fixtures.length });
}

function buildRoundLabel(matches: FootballDataMatch[], saturday: Date): string {
  const matchdays = new Set(matches.map((m) => m.matchday).filter((d): d is number => d != null));
  const dateLabel = saturday.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  if (matchdays.size === 1) {
    return `Matchweek ${[...matchdays][0]}`;
  }
  return `Matchweek of ${dateLabel}`;
}
