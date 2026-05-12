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
} from "@/components/ui";
import { getSessionPayload } from "@/lib/auth/session";

export default async function CandidateSettingsPage() {
  const session = await getSessionPayload();

  if (!session || session.role !== "candidate") {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Account settings</h1>
        <p className="mt-2 text-sm text-[--text-secondary]">
          Update login details and notification preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account credentials.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Input type="email" placeholder="Email address" />
          <Input type="password" placeholder="New password" />
          <Button>Save account settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose how you hear from us.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Checkbox defaultChecked>Email me about interview invites</Checkbox>
          <Checkbox defaultChecked>Send weekly application updates</Checkbox>
          <Checkbox>SMS reminders for scheduled interviews</Checkbox>
          <Button>Update notifications</Button>
        </CardContent>
      </Card>
    </div>
  );
}
