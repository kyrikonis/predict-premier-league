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
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
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
        className="rounded-md border border-black/10 bg-white px-3 py-2 text-black outline-none focus:border-black/30 dark:border-white/20 dark:bg-black dark:text-white"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting || username.trim().length < 2}
        className="rounded-md bg-foreground px-3 py-2 font-medium text-background disabled:opacity-50"
      >
        {submitting ? "Joining..." : "Continue"}
      </button>
      <p className="text-xs text-black/60 dark:text-white/60">
        No password needed — new usernames are registered automatically, and existing usernames just resume play.
      </p>
    </form>
  );
}
