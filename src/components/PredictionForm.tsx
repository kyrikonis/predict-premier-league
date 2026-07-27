"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TeamBadge } from "@/components/TeamBadge";

export interface TeamView {
  name: string;
  shortName: string | null;
  crest: string | null;
}

export interface FixtureView {
  id: string;
  home: TeamView;
  away: TeamView;
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
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);
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
      setStatus({ kind: "error", message: data?.error ?? "Something went wrong saving your predictions." });
      return;
    }

    setStatus({ kind: "success", message: `Saved ${data.saved} prediction${data.saved === 1 ? "" : "s"}.` });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {fixtures.map((fixture) => (
          <div
            key={fixture.id}
            className={`rounded-xl border border-black/10 bg-black/[0.015] p-4 transition dark:border-white/10 dark:bg-white/[0.03] ${
              fixture.locked ? "opacity-60" : ""
            }`}
          >
            <div className="mb-3 flex items-center justify-between text-xs text-black/50 dark:text-white/50">
              <span>
                {new Date(fixture.kickoff).toLocaleString(undefined, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {fixture.locked && (
                <span className="rounded-full bg-black/10 px-2 py-0.5 font-medium text-black/60 dark:bg-white/10 dark:text-white/60">
                  Locked
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-1 justify-center">
                <TeamBadge {...fixture.home} />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={99}
                  disabled={fixture.locked}
                  value={scores[fixture.id]?.home ?? ""}
                  onChange={(e) => updateScore(fixture.id, "home", e.target.value)}
                  className="h-11 w-11 rounded-lg border border-black/15 bg-white text-center text-lg font-semibold text-black outline-none focus:border-emerald-500 disabled:opacity-50 dark:border-white/15 dark:bg-black dark:text-white"
                />
                <span className="text-black/30 dark:text-white/30">–</span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  disabled={fixture.locked}
                  value={scores[fixture.id]?.away ?? ""}
                  onChange={(e) => updateScore(fixture.id, "away", e.target.value)}
                  className="h-11 w-11 rounded-lg border border-black/15 bg-white text-center text-lg font-semibold text-black outline-none focus:border-emerald-500 disabled:opacity-50 dark:border-white/15 dark:bg-black dark:text-white"
                />
              </div>
              <div className="flex flex-1 justify-center">
                <TeamBadge {...fixture.away} />
              </div>
            </div>
          </div>
        ))}
      </div>
      {status && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            status.kind === "success"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
          }`}
        >
          {status.message}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting || fixtures.every((f) => f.locked)}
        className="self-start rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Save predictions"}
      </button>
    </form>
  );
}
