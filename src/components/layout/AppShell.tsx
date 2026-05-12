import TopNav from "./TopNav";
import TabsNav from "./TabsNav";

type NavItem = { label: string; href: string };

type AppShellProps = {
  userEmail: string;
  logoHref: string;
  navItems: NavItem[];
  tabs: NavItem[];
  profileHref?: string;
  settingsHref?: string;
  children: React.ReactNode;
};

export default function AppShell({
  userEmail,
  logoHref,
  navItems,
  tabs,
  profileHref,
  settingsHref,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[--background] text-[--text-primary]">
      <TopNav
        logoHref={logoHref}
        items={navItems}
        userEmail={userEmail}
        profileHref={profileHref}
        settingsHref={settingsHref}
      />
      <TabsNav items={tabs} />
      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        {children}
      </main>
    </div>
  );
}
