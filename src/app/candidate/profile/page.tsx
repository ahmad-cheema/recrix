import { redirect } from "next/navigation";
import { getSessionPayload } from "@/lib/auth/session";
import { getCandidateProfile } from "@/lib/users/service";
import CandidateProfileClient from "./CandidateProfileClient";

export default async function CandidateProfilePage() {
  const session = await getSessionPayload();

  if (!session || session.role !== "candidate") {
    redirect("/login");
  }

  const profile = await getCandidateProfile(session.sub);
  return <CandidateProfileClient initialProfile={profile} />;
}
