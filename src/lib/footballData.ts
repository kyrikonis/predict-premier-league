const BASE_URL = "https://api.football-data.org/v4";

export interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: "SCHEDULED" | "TIMED" | "IN_PLAY" | "PAUSED" | "FINISHED" | "POSTPONED" | "SUSPENDED" | "CANCELLED";
  matchday: number | null;
  homeTeam: { name: string };
  awayTeam: { name: string };
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
