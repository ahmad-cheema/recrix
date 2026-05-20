import { cn } from "@/lib/utils";
import PageTransition from "./PageTransition";
import SidebarNav from "./SidebarNav";

type NavItem = { label: string; href: string };

type AppShellProps = {
  userEmail: string;
  logoHref: string;
  navItems: NavItem[];
  profileHref?: string;
  settingsHref?: string;
  roleLabel?: string;
  rightRail?: React.ReactNode;
  children: React.ReactNode;
};

export default function AppShell({
  userEmail,
  logoHref,
  navItems,
  profileHref,
  settingsHref,
  roleLabel,
  rightRail,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[--background] text-[--text-primary]">
      <div className="grid min-h-screen lg:grid-cols-[260px_minmax(0,1fr)]">
        <SidebarNav
          logoHref={logoHref}
          items={navItems}
          userEmail={userEmail}
          roleLabel={roleLabel}
          profileHref={profileHref}
          settingsHref={settingsHref}
        />
        <main role="main" className="flex-1 px-6 py-6 lg:px-[var(--gutter)]">
          <PageTransition>
            <div
              className={cn(
                "grid gap-[var(--gutter)]",
                rightRail ? "lg:grid-cols-[minmax(0,1fr)_320px]" : "grid-cols-1"
              )}
            >
              <div className="min-w-0">{children}</div>
              {rightRail ? (
                <aside className="flex flex-col gap-4">{rightRail}</aside>
              ) : null}
            </div>
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
