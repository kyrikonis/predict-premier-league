"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UsernameForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    router.push("/predict");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <label htmlFor="username" className="text-sm font-medium">
        Enter your username to play
      </label>
      <input
        id="username"
        name="username"
        type="text"
        autoFocus
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="e.g. Dad"
        className="rounded-lg border border-black/15 bg-white px-3 py-2.5 text-black outline-none transition focus:border-emerald-500 dark:border-white/15 dark:bg-black dark:text-white"
      />
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting || username.trim().length < 2}
        className="rounded-lg bg-emerald-600 px-3 py-2.5 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {submitting ? "Joining..." : "Continue"}
      </button>
      <p className="text-center text-xs text-black/50 dark:text-white/50">
        No password needed — new usernames are registered automatically, existing usernames just
        resume play.
      </p>
    </form>
  );
}
