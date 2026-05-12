import { redirect } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
} from "@/components/ui";
import { getSessionPayload } from "@/lib/auth/session";

export default async function CandidateProfilePage() {
  const session = await getSessionPayload();

  if (!session || session.role !== "candidate") {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="mt-2 text-sm text-[--text-secondary]">
          Keep your profile updated for better matches.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
          <CardDescription>Shown on your applications.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input placeholder="Full name" />
            <Input placeholder="Current title" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input placeholder="Location" />
            <Input placeholder="LinkedIn or portfolio" />
          </div>
          <Textarea rows={4} placeholder="Summary" />
          <Button>Save profile</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resume</CardTitle>
          <CardDescription>Replace the resume used in applications.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Input type="file" />
          <Button>Upload resume</Button>
        </CardContent>
      </Card>
    </div>
  );
}
