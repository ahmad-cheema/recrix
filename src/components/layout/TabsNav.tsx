"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type TabItem = { label: string; href: string };

export default function TabsNav({ items }: { items: TabItem[] }) {
  const pathname = usePathname();

  return (
    <div className="border-b border-[--border] bg-[--surface]">
      <div className="mx-auto flex w-full max-w-7xl gap-6 overflow-x-auto px-6">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "border-b-2 px-1 py-3 text-sm font-medium transition-colors",
                active
                  ? "border-[--text-primary] text-[--text-primary]"
                  : "border-transparent text-[--text-secondary] hover:text-[--text-primary]"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
