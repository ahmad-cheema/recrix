import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getSessionPayload } from "@/lib/auth/session";

const navItems = [
  { label: "Dashboard", href: "/recruiter/dashboard" },
  { label: "Jobs", href: "/recruiter/jobs" },
  { label: "Screening", href: "/recruiter/screening" },
  { label: "Applicants", href: "/recruiter/applicants" },
  { label: "Reports", href: "/recruiter/reports" },
  { label: "Settings", href: "/recruiter/settings" },
];

const tabs = [
  { label: "Overview", href: "/recruiter/dashboard" },
  { label: "Pipeline", href: "/recruiter/applicants" },
  { label: "Screening", href: "/recruiter/screening" },
  { label: "Analytics", href: "/recruiter/reports" },
  { label: "Team", href: "/recruiter/settings" },
];

export default async function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionPayload();

  if (!session || session.role !== "recruiter") {
    redirect("/login");
  }

  return (
    <AppShell
      userEmail={session.email}
      logoHref="/recruiter/dashboard"
      navItems={navItems}
      tabs={tabs}
      profileHref="/recruiter/settings"
      settingsHref="/recruiter/settings"
    >
      {children}
    </AppShell>
  );
}
