import { redirect } from "next/navigation";
import { getSessionPayload } from "@/lib/auth/session";
import { getCandidateSettings } from "@/lib/users/service";
import CandidateSettingsClient from "./CandidateSettingsClient";

export default async function CandidateSettingsPage() {
  const session = await getSessionPayload();

  if (!session || session.role !== "candidate") {
    redirect("/login");
  }

  const settings = await getCandidateSettings(session.sub);
  return <CandidateSettingsClient initialSettings={settings} />;
}
