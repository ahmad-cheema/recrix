"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import LogoutButton from "./LogoutButton";

type NavItem = { label: string; href: string };

type TopNavProps = {
  logoHref: string;
  items: NavItem[];
  userEmail: string;
  profileHref?: string;
  settingsHref?: string;
};

function IconBell({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6.5 9.5a5.5 5.5 0 0 1 11 0v4.1l1.2 2.4H5.3l1.2-2.4Z" />
      <path d="M9.8 18.5a2.3 2.3 0 0 0 4.4 0" />
    </svg>
  );
}

function IconChevron({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function TopNav({
  logoHref,
  items,
  userEmail,
  profileHref = "/profile",
  settingsHref = "/settings",
}: TopNavProps) {
  const pathname = usePathname();

  return (
    <div className="border-b border-[--border] bg-[--surface]">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <div className="flex items-center gap-8">
          <Link
            href={logoHref}
            className="text-lg font-semibold tracking-tight text-[--text-primary]"
          >
            Recrix
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-[--text-secondary] md:flex">
            {items.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "transition-colors hover:text-[--text-primary]",
                    active && "text-[--text-primary]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <details className="relative">
            <summary
              className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-[--border] text-[--text-secondary] transition-colors hover:border-[--text-muted] hover:text-[--text-primary]"
              aria-label="Notifications"
            >
              <IconBell className="h-4 w-4" />
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-[--border] bg-[--surface] p-3 text-sm text-[--text-secondary]">
              <p className="text-xs uppercase tracking-wide text-[--text-muted]">
                Notifications
              </p>
              <div className="mt-2 rounded-md border border-[--border-subtle] bg-[--surface-raised] px-3 py-2 text-xs">
                No new notifications.
              </div>
            </div>
          </details>

          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-[--border] px-2 py-1 text-sm text-[--text-secondary] transition-colors hover:border-[--text-muted] hover:text-[--text-primary]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[--border] text-xs text-[--text-primary]">
                {userEmail.slice(0, 2).toUpperCase()}
              </span>
              <span className="hidden text-xs font-medium md:inline">
                {userEmail}
              </span>
              <IconChevron className="h-4 w-4" />
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-[--border] bg-[--surface] p-2 text-sm text-[--text-secondary]">
              <Link
                href={profileHref}
                className="flex w-full items-center rounded-md px-3 py-2 text-sm text-[--text-secondary] transition-colors hover:bg-[--surface-raised] hover:text-[--text-primary]"
              >
                Profile
              </Link>
              <Link
                href={settingsHref}
                className="flex w-full items-center rounded-md px-3 py-2 text-sm text-[--text-secondary] transition-colors hover:bg-[--surface-raised] hover:text-[--text-primary]"
              >
                Settings
              </Link>
              <div className="my-2 h-px bg-[--border-subtle]" />
              <LogoutButton className="w-full justify-start px-3 py-2" />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
