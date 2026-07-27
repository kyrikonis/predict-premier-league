import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AuthForm } from "@/components/AuthForm";
import { ClubCrestStrip } from "@/components/ClubCrestStrip";

export default async function Home() {
  const session = await getSession();

  if (session.userId) {
    redirect("/predict");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-black/10 p-8 shadow-sm dark:border-white/10">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Greek Cypriots Growing up in the UK
          </p>
          <h1 className="text-2xl font-bold">Predict Premier League</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Predict 6 Premier League scores every matchweek. Exact score = 3 points, correct
            result = 1 point.
          </p>
        </div>
        <AuthForm />
      </div>
      <ClubCrestStrip />
    </main>
  );
}
