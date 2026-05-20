import { redirect } from "next/navigation";

export default function RecruiterJobApplicationDetailRedirect({
  params,
}: {
  params: { appId: string };
}) {
  redirect(`/recruiter/applications/${params.appId}`);
}
