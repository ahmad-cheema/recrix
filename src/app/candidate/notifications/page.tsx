import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { getSessionPayload } from "@/lib/auth/session";

export default async function CandidateNotificationsPage() {
  const session = await getSessionPayload();

  if (!session || session.role !== "candidate") {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="mt-2 text-sm text-[--text-secondary]">
          Alerts about interview scheduling and recruiter feedback.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>Latest updates from your applications.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-[--border-subtle] bg-[--surface-raised] p-6 text-sm text-[--text-secondary]">
            You are all caught up.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
