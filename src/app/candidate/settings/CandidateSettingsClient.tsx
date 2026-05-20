"use client";

import * as React from "react";
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
import type { CandidateSettings } from "@/lib/users/types";

type Props = {
  initialSettings: CandidateSettings;
};

export default function CandidateSettingsClient({ initialSettings }: Props) {
  const [email, setEmail] = React.useState(initialSettings.email);
  const [newPassword, setNewPassword] = React.useState("");
  const [notifications, setNotifications] = React.useState(
    initialSettings.notifications
  );

  const [accountSaving, setAccountSaving] = React.useState(false);
  const [accountMessage, setAccountMessage] = React.useState<string | null>(null);
  const [accountError, setAccountError] = React.useState<string | null>(null);

  const [notificationsSaving, setNotificationsSaving] = React.useState(false);
  const [notificationsMessage, setNotificationsMessage] = React.useState<string | null>(null);
  const [notificationsError, setNotificationsError] = React.useState<string | null>(null);

  async function saveAccountSettings() {
    setAccountSaving(true);
    setAccountError(null);
    setAccountMessage(null);
    try {
      const response = await fetch("/api/candidate/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "account",
          email,
          newPassword: newPassword || undefined,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        account?: { email: string };
      };
      if (!response.ok || !payload.account) {
        throw new Error(payload.error ?? "Failed to save account settings.");
      }
      setEmail(payload.account.email);
      setNewPassword("");
      setAccountMessage("Account settings updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save account settings.";
      setAccountError(message);
    } finally {
      setAccountSaving(false);
    }
  }

  async function saveNotifications() {
    setNotificationsSaving(true);
    setNotificationsError(null);
    setNotificationsMessage(null);
    try {
      const response = await fetch("/api/candidate/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "notifications",
          notifications,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        notifications?: CandidateSettings["notifications"];
      };
      if (!response.ok || !payload.notifications) {
        throw new Error(payload.error ?? "Failed to update notifications.");
      }
      setNotifications(payload.notifications);
      setNotificationsMessage("Notification preferences updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update notifications.";
      setNotificationsError(message);
    } finally {
      setNotificationsSaving(false);
    }
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
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
          />
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
          />
          <Button onClick={saveAccountSettings} disabled={accountSaving}>
            {accountSaving ? "Saving..." : "Save account settings"}
          </Button>
          {accountMessage ? <p className="text-sm text-emerald-400">{accountMessage}</p> : null}
          {accountError ? <p className="text-sm text-[--destructive]">{accountError}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose how you hear from us.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Checkbox
            checked={notifications.interviewInvites}
            onChange={(e) =>
              setNotifications((prev) => ({
                ...prev,
                interviewInvites: e.target.checked,
              }))
            }
          >
            Email me about interview invites
          </Checkbox>
          <Checkbox
            checked={notifications.weeklyUpdates}
            onChange={(e) =>
              setNotifications((prev) => ({
                ...prev,
                weeklyUpdates: e.target.checked,
              }))
            }
          >
            Send weekly application updates
          </Checkbox>
          <Checkbox
            checked={notifications.smsReminders}
            onChange={(e) =>
              setNotifications((prev) => ({
                ...prev,
                smsReminders: e.target.checked,
              }))
            }
          >
            SMS reminders for scheduled interviews
          </Checkbox>
          <Button onClick={saveNotifications} disabled={notificationsSaving}>
            {notificationsSaving ? "Saving..." : "Update notifications"}
          </Button>
          {notificationsMessage ? (
            <p className="text-sm text-emerald-400">{notificationsMessage}</p>
          ) : null}
          {notificationsError ? (
            <p className="text-sm text-[--destructive]">{notificationsError}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
