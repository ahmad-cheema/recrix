"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import LogoutButton from "./LogoutButton";

type NavItem = { label: string; href: string };

type SidebarNavProps = {
  logoHref: string;
  items: NavItem[];
  userEmail: string;
  roleLabel?: string;
  profileHref?: string;
  settingsHref?: string;
};

function IconMenu({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export default function SidebarNav({
  logoHref,
  items,
  userEmail,
  roleLabel,
  profileHref = "/profile",
  settingsHref = "/settings",
}: SidebarNavProps) {
  const pathname = usePathname();
  const initials = userEmail.slice(0, 2).toUpperCase();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Close mobile nav on route change
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navContent = (
    <>
      <div className="flex items-center justify-between">
        <Link
          href={logoHref}
          className="text-lg font-semibold tracking-tight text-[--text-primary]"
        >
          Recrix
        </Link>
        <span className="hidden rounded-full border border-[--border] bg-[--surface-raised] px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[--text-muted] lg:inline">
          {roleLabel ?? "Workspace"}
        </span>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[--text-secondary] hover:text-[--text-primary] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        >
          <IconClose className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[--text-muted]">
          Menu
        </p>
        <nav role="navigation" aria-label="Main navigation" className="flex flex-col gap-1">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent] focus-visible:ring-offset-2 focus-visible:ring-offset-[--surface]",
                  active
                    ? "bg-[--surface-raised] text-[--text-primary]"
                    : "text-[--text-secondary] hover:bg-[--surface-raised] hover:text-[--text-primary]"
                )}
              >
                <span>{item.label}</span>
                {active ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-[--accent]" />
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto">
        <details className="group rounded-lg border border-[--border] bg-[--surface-raised]">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[--border] bg-[--surface] text-xs font-semibold text-[--text-primary]">
              {initials}
            </span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-[--text-primary]">
                {userEmail}
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[--text-muted]">
                Account
              </p>
            </div>
            <span className="text-xs text-[--text-muted] transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="flex flex-col gap-1 border-t border-[--border] px-3 py-2">
            <Link
              href={profileHref}
              className="rounded-md px-2 py-1 text-sm text-[--text-secondary] transition-colors hover:bg-[--surface] hover:text-[--text-primary]"
            >
              Profile
            </Link>
            <Link
              href={settingsHref}
              className="rounded-md px-2 py-1 text-sm text-[--text-secondary] transition-colors hover:bg-[--surface] hover:text-[--text-primary]"
            >
              Settings
            </Link>
            <LogoutButton className="mt-2 w-full justify-start rounded-md px-2 py-1" />
          </div>
        </details>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-[--border] bg-[--surface] px-4 py-3 lg:hidden">
        <Link
          href={logoHref}
          className="text-lg font-semibold tracking-tight text-[--text-primary]"
        >
          Recrix
        </Link>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[--border] text-[--text-secondary] hover:text-[--text-primary]"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <IconMenu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {/* Desktop sidebar (always visible at lg+) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-6 border-r border-[--border] bg-[--surface] px-5 py-6 transition-transform duration-200 lg:static lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
