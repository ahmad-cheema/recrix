import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { getSessionPayload } from "@/lib/auth/session";

export default async function CandidateMessagesPage() {
  const session = await getSessionPayload();

  if (!session || session.role !== "candidate") {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Messages</h1>
        <p className="mt-2 text-sm text-[--text-secondary]">
          Stay in sync with recruiters and interview coordinators.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>Recent recruiter updates.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-[--border-subtle] bg-[--surface-raised] p-6 text-sm text-[--text-secondary]">
            No messages yet. You will see recruiter conversations here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
