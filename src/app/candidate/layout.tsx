import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getSessionPayload } from "@/lib/auth/session";

const navItems = [
  { label: "Dashboard", href: "/candidate/dashboard" },
  { label: "Jobs", href: "/candidate/jobs" },
  { label: "Applications", href: "/candidate/applications" },
  { label: "Interviews", href: "/candidate/interviews" },
  { label: "Saved", href: "/candidate/saved" },
  { label: "Profile", href: "/candidate/profile" },
  { label: "Messages", href: "/candidate/messages" },
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
      profileHref="/candidate/profile"
      settingsHref="/candidate/settings"
      roleLabel="Candidate"
    >
      {children}
    </AppShell>
  );
}
