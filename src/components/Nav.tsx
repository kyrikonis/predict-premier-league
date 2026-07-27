import Link from "next/link";
import { getSession } from "@/lib/session";
import { LogoutButton } from "@/components/LogoutButton";

export async function Nav() {
  const session = await getSession();

  if (!session.userId) return null;

  return (
    <nav className="sticky top-0 z-10 border-b border-black/10 bg-background/80 backdrop-blur dark:border-white/10">
      <p className="px-4 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-600 sm:px-6 dark:text-emerald-400">
        Greek Cypriots Growing up in the UK
      </p>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <span className="text-sm font-bold tracking-tight">
            <span className="hidden sm:inline">Predict Premier League</span>
            <span className="sm:hidden">PPL</span>
          </span>
          <div className="flex gap-4 text-sm font-medium text-black/70 dark:text-white/70">
            <Link href="/predict" className="transition hover:text-foreground">
              Predict
            </Link>
            <Link href="/leaderboard" className="transition hover:text-foreground">
              Leaderboard
            </Link>
            <Link href="/winners" className="transition hover:text-foreground">
              Winners
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="rounded-full bg-black/5 px-3 py-1 font-medium dark:bg-white/10">{session.username}</span>
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
