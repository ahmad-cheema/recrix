import { redirect } from "next/navigation";
import { getSessionPayload } from "@/lib/auth/session";
import { getRecruiterSettings } from "@/lib/users/service";
import RecruiterSettingsClient from "./RecruiterSettingsClient";

export default async function RecruiterSettingsPage() {
  const session = await getSessionPayload();

  if (!session || session.role !== "recruiter") {
    redirect("/login");
  }

  const settings = await getRecruiterSettings(session.sub);
  return <RecruiterSettingsClient initialSettings={settings} />;
}
