import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getSessionPayload } from "@/lib/auth/session";

const navItems = [
  { label: "Dashboard", href: "/candidate/dashboard" },
  { label: "Jobs", href: "/candidate/jobs" },
  { label: "Applications", href: "/candidate/applications" },
  { label: "Profile", href: "/candidate/profile" },
  { label: "Messages", href: "/candidate/messages" },
];

const tabs = [
  { label: "Overview", href: "/candidate/dashboard" },
  { label: "Saved", href: "/candidate/saved" },
  { label: "Tracker", href: "/candidate/applications" },
  { label: "Profile", href: "/candidate/profile" },
  { label: "Notifications", href: "/candidate/notifications" },
];

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionPayload();

  if (!session || session.role !== "candidate") {
    redirect("/login");
  }

  return (
    <AppShell
      userEmail={session.email}
      logoHref="/candidate/dashboard"
      navItems={navItems}
      tabs={tabs}
      profileHref="/candidate/profile"
      settingsHref="/candidate/settings"
    >
      {children}
    </AppShell>
  );
}
