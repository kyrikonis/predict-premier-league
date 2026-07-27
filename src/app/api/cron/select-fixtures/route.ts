import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPremierLeagueMatches } from "@/lib/footballData";
import { formatDateYYYYMMDD, isFridayOrMonday, isSaturdayOrSunday } from "@/lib/dates";

const GAMES_PER_ROUND = 6;
const SEARCH_WINDOW_DAYS = 45;

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

  const existingActiveRound = await prisma.round.findFirst({
    where: { status: { in: ["UPCOMING", "LOCKED"] } },
  });
  if (existingActiveRound) {
    return NextResponse.json({ message: "An active round already exists", skipped: true });
  }

  const today = new Date();
  const windowEnd = new Date(today);
  windowEnd.setUTCDate(windowEnd.getUTCDate() + SEARCH_WINDOW_DAYS);

  const upcomingMatches = await getPremierLeagueMatches(
    formatDateYYYYMMDD(today),
    formatDateYYYYMMDD(windowEnd)
  );

  const playable = upcomingMatches.filter(
    (m) => m.matchday != null && (m.status === "SCHEDULED" || m.status === "TIMED")
  );

  if (playable.length === 0) {
    return NextResponse.json(
      { message: `No Premier League matches found in the next ${SEARCH_WINDOW_DAYS} days`, skipped: true },
      { status: 200 }
    );
  }

  const nextMatchday = Math.min(...playable.map((m) => m.matchday as number));
  const matchdayMatches = playable.filter((m) => m.matchday === nextMatchday);

  const weekendMatches = matchdayMatches.filter((m) => isSaturdayOrSunday(m.utcDate));
  let selected = shuffle(weekendMatches).slice(0, GAMES_PER_ROUND);

  if (selected.length < GAMES_PER_ROUND) {
    const selectedIds = new Set(selected.map((m) => m.id));
    const fridayMondayMatches = matchdayMatches.filter(
      (m) => !selectedIds.has(m.id) && isFridayOrMonday(m.utcDate)
    );
    const extras = shuffle(fridayMondayMatches).slice(0, GAMES_PER_ROUND - selected.length);
    selected = [...selected, ...extras];
  }

  const round = await prisma.round.create({
    data: {
      label: `Matchweek ${nextMatchday}`,
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
