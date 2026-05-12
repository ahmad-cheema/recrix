import { redirect } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Textarea,
} from "@/components/ui";
import { getSessionPayload } from "@/lib/auth/session";

export default async function RecruiterSettingsPage() {
  const session = await getSessionPayload();

  if (!session || session.role !== "recruiter") {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-[--text-secondary]">
          Update your company profile and notification preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company profile</CardTitle>
          <CardDescription>Shown to candidates on job listings.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input placeholder="Company name" />
            <Input placeholder="Industry" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input placeholder="Website" />
            <Input placeholder="HQ location" />
          </div>
          <Textarea placeholder="Company overview" rows={4} />
          <Button>Save company profile</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hiring preferences</CardTitle>
          <CardDescription>Control how candidates are routed.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Checkbox defaultChecked>
            Auto-score resumes when applications arrive
          </Checkbox>
          <Checkbox defaultChecked>Notify me when match score exceeds 80</Checkbox>
          <Checkbox>Allow candidates to request interview time slots</Checkbox>
          <Button>Save preferences</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Customize alerts from Recrix.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Checkbox defaultChecked>Email me daily pipeline summaries</Checkbox>
          <Checkbox defaultChecked>Slack alerts for new applicants</Checkbox>
          <Checkbox>Weekly hiring performance report</Checkbox>
          <Button>Update notifications</Button>
        </CardContent>
      </Card>
    </div>
  );
}
