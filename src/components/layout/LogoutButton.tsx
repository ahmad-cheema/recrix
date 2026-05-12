"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={cn(
        "flex items-center rounded-md text-sm text-[--text-secondary] transition-colors hover:bg-[--surface-raised] hover:text-[--text-primary]",
        className
      )}
    >
      Log out
    </button>
  );
}
