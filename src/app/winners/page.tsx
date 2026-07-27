import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

const PAST_WINNERS = [
  { season: "2025-2026", name: "Adam Adamou" },
  { season: "2024-2025", name: "Andrew Kanias" },
  { season: "2023-2024", name: "Andy Konis" },
  { season: "2022-2023", name: "Andrew Kanias" },
  { season: "2021-2022", name: "Zelia Hagisavva" },
  { season: "2020-2021", name: "Antonios Evangelou" },
  { season: "2019-2020", name: "Antonios Evangelou" },
  { season: "2018-2019", name: "Andrew Kanias" },
];

export default async function WinnersPage() {
  const session = await getSession();
  if (!session.userId) redirect("/");

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-xl font-bold">Past Winners</h1>
      <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
        {PAST_WINNERS.map((winner) => (
          <div
            key={winner.season}
            className="flex items-center gap-4 border-b border-black/5 px-4 py-3 last:border-b-0 dark:border-white/5"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
            <span className="flex-1 font-medium">{winner.name}</span>
            <span className="text-sm text-black/50 dark:text-white/50">{winner.season}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
