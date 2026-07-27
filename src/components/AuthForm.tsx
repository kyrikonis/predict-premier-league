"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);

    const res = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
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
    <div className="flex w-full flex-col gap-4">
      <div className="flex rounded-lg bg-black/5 p-1 text-sm font-medium dark:bg-white/10">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`flex-1 rounded-md py-1.5 transition ${
            mode === "login" ? "bg-white shadow-sm dark:bg-black" : "text-black/60 dark:text-white/60"
          }`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`flex-1 rounded-md py-1.5 transition ${
            mode === "signup" ? "bg-white shadow-sm dark:bg-black" : "text-black/60 dark:text-white/60"
          }`}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="username" className="text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-lg border border-black/15 bg-white px-3 py-2.5 text-black outline-none transition focus:border-emerald-500 dark:border-white/15 dark:bg-black dark:text-white"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-black/15 bg-white px-3 py-2.5 text-black outline-none transition focus:border-emerald-500 dark:border-white/15 dark:bg-black dark:text-white"
          />
        </div>

        {mode === "signup" && (
          <>
            <div className="flex flex-col gap-1">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-lg border border-black/15 bg-white px-3 py-2.5 text-black outline-none transition focus:border-emerald-500 dark:border-white/15 dark:bg-black dark:text-white"
              />
            </div>
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
              Save this password somewhere safe. There&rsquo;s no email on file and no way to
              recover or reset it if you forget it.
            </p>
          </>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || username.trim().length < 2 || password.length === 0}
          className="rounded-lg bg-emerald-600 px-3 py-2.5 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
