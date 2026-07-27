import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

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
      <h1 className="mb-4 text-xl font-bold">Leaderboard</h1>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/10 text-left dark:border-white/10">
            <th className="py-2">#</th>
            <th className="py-2">Username</th>
            <th className="py-2 text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => (
            <tr key={s.username} className="border-b border-black/5 dark:border-white/5">
              <td className="py-2">{i + 1}</td>
              <td className="py-2">{s.username}</td>
              <td className="py-2 text-right font-semibold">{s.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
