import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { PredictionForm, type FixtureView } from "@/components/PredictionForm";
import { TeamBadge } from "@/components/TeamBadge";

export default async function PredictPage() {
  const session = await getSession();
  if (!session.userId) redirect("/");

  const round = await prisma.round.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      fixtures: {
        orderBy: { kickoff: "asc" },
        include: { predictions: { where: { userId: session.userId } } },
      },
    },
  });

  if (!round) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <div className="rounded-xl border border-black/10 p-6 text-center dark:border-white/10">
          <h1 className="mb-2 text-xl font-bold">No matchweek yet</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Check back soon — this week&rsquo;s 6 games haven&rsquo;t been picked yet.
          </p>
        </div>
      </main>
    );
  }

  if (round.status === "COMPLETE") {
    const totalPoints = round.fixtures.reduce((sum, f) => sum + (f.predictions[0]?.pointsAwarded ?? 0), 0);
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="mb-1 text-xl font-bold">{round.label} — results</h1>
        <p className="mb-6 text-sm text-black/60 dark:text-white/60">
          You scored {totalPoints} point{totalPoints === 1 ? "" : "s"} this matchweek.
        </p>
        <div className="flex flex-col gap-3">
          {round.fixtures.map((fixture) => {
            const prediction = fixture.predictions[0];
            const points = prediction?.pointsAwarded ?? 0;
            const pointsStyle =
              points === 3
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                : points === 1
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"
                  : "bg-black/5 text-black/50 dark:bg-white/10 dark:text-white/50";

            return (
              <div
                key={fixture.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-black/10 p-4 dark:border-white/10"
              >
                <div className="flex flex-1 items-center justify-center gap-4">
                  <TeamBadge name={fixture.homeTeam} shortName={fixture.homeShortName} crest={fixture.homeCrest} />
                  <span className="text-lg font-semibold">
                    {fixture.homeScore} – {fixture.awayScore}
                  </span>
                  <TeamBadge name={fixture.awayTeam} shortName={fixture.awayShortName} crest={fixture.awayCrest} />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full px-2.5 py-1 text-sm font-semibold ${pointsStyle}`}>
                    +{points}
                  </span>
                  <span className="text-xs text-black/50 dark:text-white/50">
                    {prediction ? `You: ${prediction.predictedHome}-${prediction.predictedAway}` : "No prediction"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  // Server Component rendered fresh per request — reading the current time here is correct,
  // not a stale/impure render (the purity rule is written for client re-renders).
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const fixtures: FixtureView[] = round.fixtures.map((fixture) => {
    const prediction = fixture.predictions[0];
    return {
      id: fixture.id,
      home: { name: fixture.homeTeam, shortName: fixture.homeShortName, crest: fixture.homeCrest },
      away: { name: fixture.awayTeam, shortName: fixture.awayShortName, crest: fixture.awayCrest },
      kickoff: fixture.kickoff.toISOString(),
      locked: fixture.kickoff.getTime() <= now,
      predictedHome: prediction?.predictedHome ?? null,
      predictedAway: prediction?.predictedAway ?? null,
    };
  });

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-1 text-xl font-bold">{round.label}</h1>
      <p className="mb-6 text-sm text-black/60 dark:text-white/60">
        Predict each score before kickoff. Exact score = 3 points, correct result = 1 point.
      </p>
      <PredictionForm fixtures={fixtures} />
    </main>
  );
}
