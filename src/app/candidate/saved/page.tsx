import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { getSessionPayload } from "@/lib/auth/session";

const primaryLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-[--text-primary] px-4 py-2 text-sm font-medium text-[--background] transition-colors hover:bg-[--accent-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]";

export default async function CandidateSavedPage() {
  const session = await getSessionPayload();

  if (!session || session.role !== "candidate") {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Saved roles</h1>
        <p className="mt-2 text-sm text-[--text-secondary]">
          Keep track of roles you want to apply for later.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your saved list</CardTitle>
          <CardDescription>Nothing saved yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 rounded-lg border border-[--border-subtle] bg-[--surface-raised] p-6 text-sm text-[--text-secondary]">
            Save roles from the job board to see them here.
            <Link className={primaryLinkClass} href="/candidate/jobs">
              Browse jobs
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
