"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface FixtureView {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  locked: boolean;
  predictedHome: number | null;
  predictedAway: number | null;
}

export function PredictionForm({ fixtures }: { fixtures: FixtureView[] }) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>(
    Object.fromEntries(
      fixtures.map((f) => [
        f.id,
        { home: f.predictedHome?.toString() ?? "", away: f.predictedAway?.toString() ?? "" },
      ])
    )
  );
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateScore(fixtureId: string, side: "home" | "away", value: string) {
    setScores((prev) => ({ ...prev, [fixtureId]: { ...prev[fixtureId], [side]: value } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const predictions = fixtures
      .filter((f) => !f.locked)
      .map((f) => ({
        fixtureId: f.id,
        predictedHome: Number(scores[f.id]?.home),
        predictedAway: Number(scores[f.id]?.away),
      }))
      .filter((p) => Number.isInteger(p.predictedHome) && Number.isInteger(p.predictedAway));

    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ predictions }),
    });

    const data = await res.json().catch(() => null);
    setSubmitting(false);

    if (!res.ok) {
      setStatus(data?.error ?? "Something went wrong saving your predictions.");
      return;
    }

    setStatus(`Saved ${data.saved} prediction${data.saved === 1 ? "" : "s"}.`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {fixtures.map((fixture) => (
          <div
            key={fixture.id}
            className="flex items-center justify-between gap-4 rounded-md border border-black/10 p-4 dark:border-white/10"
          >
            <div className="flex flex-1 flex-col">
              <span className="font-medium">
                {fixture.homeTeam} vs {fixture.awayTeam}
              </span>
              <span className="text-xs text-black/50 dark:text-white/50">
                {new Date(fixture.kickoff).toLocaleString(undefined, {
                  weekday: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {fixture.locked ? " — locked" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={99}
                disabled={fixture.locked}
                value={scores[fixture.id]?.home ?? ""}
                onChange={(e) => updateScore(fixture.id, "home", e.target.value)}
                className="w-14 rounded-md border border-black/10 bg-white px-2 py-1 text-center text-black disabled:opacity-50 dark:border-white/20 dark:bg-black dark:text-white"
              />
              <span>-</span>
              <input
                type="number"
                min={0}
                max={99}
                disabled={fixture.locked}
                value={scores[fixture.id]?.away ?? ""}
                onChange={(e) => updateScore(fixture.id, "away", e.target.value)}
                className="w-14 rounded-md border border-black/10 bg-white px-2 py-1 text-center text-black disabled:opacity-50 dark:border-white/20 dark:bg-black dark:text-white"
              />
            </div>
          </div>
        ))}
      </div>
      {status && <p className="text-sm">{status}</p>}
      <button
        type="submit"
        disabled={submitting || fixtures.every((f) => f.locked)}
        className="self-start rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Save predictions"}
      </button>
    </form>
  );
}
