const BASE_URL = "https://api.football-data.org/v4";

export interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: "SCHEDULED" | "TIMED" | "IN_PLAY" | "PAUSED" | "FINISHED" | "POSTPONED" | "SUSPENDED" | "CANCELLED";
  matchday: number | null;
  homeTeam: { name: string; shortName: string | null; crest: string | null };
  awayTeam: { name: string; shortName: string | null; crest: string | null };
  score: {
    fullTime: { home: number | null; away: number | null };
  };
}

async function footballDataFetch(path: string): Promise<{ matches: FootballDataMatch[] }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY! },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`football-data.org request failed (${res.status}): ${await res.text()}`);
  }

  return res.json();
}

export async function getPremierLeagueMatches(dateFrom: string, dateTo: string): Promise<FootballDataMatch[]> {
  const data = await footballDataFetch(`/competitions/PL/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`);
  return data.matches;
}

export interface FootballDataTeam {
  id: number;
  name: string;
  shortName: string | null;
  crest: string | null;
}

// Purely decorative (club crest strip) — cached for a day rather than fetched fresh every
// request, since the full club list barely ever changes and this isn't scoring-critical data.
export async function getPremierLeagueTeams(): Promise<FootballDataTeam[]> {
  const res = await fetch(`${BASE_URL}/competitions/PL/teams`, {
    headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY! },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    throw new Error(`football-data.org request failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { teams: FootballDataTeam[] };
  return data.teams;
}
