import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { UsernameForm } from "@/components/UsernameForm";

export default async function Home() {
  const session = await getSession();

  if (session.userId) {
    redirect("/predict");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Predict Premier League</h1>
      <p className="max-w-sm text-center text-sm text-black/70 dark:text-white/70">
        Predict the scores for 6 Premier League games every matchweek. 3 points for an exact score, 1 point for the
        correct result.
      </p>
      <UsernameForm />
    </main>
  );
}
