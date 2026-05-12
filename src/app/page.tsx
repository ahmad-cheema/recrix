import { redirect } from "next/navigation";
import { getSessionPayload } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSessionPayload();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "recruiter") {
    redirect("/recruiter/dashboard");
  }

  if (session.role === "candidate") {
    redirect("/candidate/dashboard");
  }

  redirect("/login");
}
