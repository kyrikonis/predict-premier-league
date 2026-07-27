import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const RANK_BADGE: Record<number, string> = {
  1: "bg-amber-400 text-amber-950",
  2: "bg-zinc-300 text-zinc-800",
  3: "bg-orange-400 text-orange-950",
};

export default async function LeaderboardPage() {
  const session = await getSession();
  if (!session.userId) redirect("/");

  const [users, totals] = await Promise.all([
    prisma.user.findMany({ select: { id: true, username: true } }),
    prisma.prediction.groupBy({ by: ["userId"], _sum: { pointsAwarded: true } }),
  ]);

  const totalByUserId = new Map(totals.map((t) => [t.userId, t._sum.pointsAwarded ?? 0]));

  const standings = users
    .map((u) => ({ username: u.username, points: totalByUserId.get(u.id) ?? 0 }))
    .sort((a, b) => b.points - a.points || a.username.localeCompare(b.username));

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-xl font-bold">Leaderboard</h1>
      <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
        {standings.length === 0 ? (
          <p className="p-6 text-center text-sm text-black/50 dark:text-white/50">No players yet.</p>
        ) : (
          standings.map((s, i) => {
            const rank = i + 1;
            const isYou = s.username.toLowerCase() === session.username?.toLowerCase();
            return (
              <div
                key={s.username}
                className={`flex items-center gap-4 border-b border-black/5 px-4 py-3 last:border-b-0 dark:border-white/5 ${
                  isYou ? "bg-emerald-50 dark:bg-emerald-500/10" : ""
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    RANK_BADGE[rank] ?? "text-black/40 dark:text-white/40"
                  }`}
                >
                  {rank}
                </span>
                <span className="flex-1 font-medium">
                  {s.username}
                  {isYou && <span className="ml-2 text-xs font-normal text-emerald-700 dark:text-emerald-400">You</span>}
                </span>
                <span className="text-lg font-bold">{s.points}</span>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
