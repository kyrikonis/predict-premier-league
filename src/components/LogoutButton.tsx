"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className="text-sm text-black/60 hover:underline dark:text-white/60">
      Log out
    </button>
  );
}
