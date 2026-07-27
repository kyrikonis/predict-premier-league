import Link from "next/link";
import { getSession } from "@/lib/session";
import { LogoutButton } from "@/components/LogoutButton";

export async function Nav() {
  const session = await getSession();

  if (!session.userId) return null;

  return (
    <nav className="flex items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/10">
      <div className="flex gap-4 text-sm font-medium">
        <Link href="/predict">Predict</Link>
        <Link href="/leaderboard">Leaderboard</Link>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-black/60 dark:text-white/60">{session.username}</span>
        <LogoutButton />
      </div>
    </nav>
  );
}
