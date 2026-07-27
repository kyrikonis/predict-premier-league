import Link from "next/link";
import { getSession } from "@/lib/session";
import { LogoutButton } from "@/components/LogoutButton";

export async function Nav() {
  const session = await getSession();

  if (!session.userId) return null;

  return (
    <nav className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-black/10 bg-background/80 px-4 py-3 backdrop-blur sm:px-6 dark:border-white/10">
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
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="rounded-full bg-black/5 px-3 py-1 font-medium dark:bg-white/10">{session.username}</span>
        <LogoutButton />
      </div>
    </nav>
  );
}
