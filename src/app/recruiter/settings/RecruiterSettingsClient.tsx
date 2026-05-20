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
  Textarea,
} from "@/components/ui";
import type { RecruiterSettings } from "@/lib/users/types";

type Props = {
  initialSettings: RecruiterSettings;
};

export default function RecruiterSettingsClient({ initialSettings }: Props) {
  const [companyProfile, setCompanyProfile] = React.useState(
    initialSettings.companyProfile
  );
  const [hiringPreferences, setHiringPreferences] = React.useState(
    initialSettings.hiringPreferences
  );
  const [notifications, setNotifications] = React.useState(
    initialSettings.notifications
  );

  const [companySaving, setCompanySaving] = React.useState(false);
  const [companyMessage, setCompanyMessage] = React.useState<string | null>(null);
  const [companyError, setCompanyError] = React.useState<string | null>(null);

  const [hiringSaving, setHiringSaving] = React.useState(false);
  const [hiringMessage, setHiringMessage] = React.useState<string | null>(null);
  const [hiringError, setHiringError] = React.useState<string | null>(null);

  const [notificationsSaving, setNotificationsSaving] = React.useState(false);
  const [notificationsMessage, setNotificationsMessage] = React.useState<string | null>(null);
  const [notificationsError, setNotificationsError] = React.useState<string | null>(null);

  async function saveCompanyProfile() {
    setCompanySaving(true);
    setCompanyMessage(null);
    setCompanyError(null);

    try {
      const response = await fetch("/api/recruiter/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "company",
          companyProfile,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        companyProfile?: RecruiterSettings["companyProfile"];
      };
      if (!response.ok || !payload.companyProfile) {
        throw new Error(payload.error ?? "Failed to save company profile.");
      }
      setCompanyProfile(payload.companyProfile);
      setCompanyMessage("Company profile updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save company profile.";
      setCompanyError(message);
    } finally {
      setCompanySaving(false);
    }
  }

  async function saveHiringPreferences() {
    setHiringSaving(true);
    setHiringMessage(null);
    setHiringError(null);

    try {
      const response = await fetch("/api/recruiter/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "hiring",
          hiringPreferences,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        hiringPreferences?: RecruiterSettings["hiringPreferences"];
      };
      if (!response.ok || !payload.hiringPreferences) {
        throw new Error(payload.error ?? "Failed to save preferences.");
      }
      setHiringPreferences(payload.hiringPreferences);
      setHiringMessage("Hiring preferences updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save preferences.";
      setHiringError(message);
    } finally {
      setHiringSaving(false);
    }
  }

  async function saveNotifications() {
    setNotificationsSaving(true);
    setNotificationsMessage(null);
    setNotificationsError(null);

    try {
      const response = await fetch("/api/recruiter/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "notifications",
          notifications,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        notifications?: RecruiterSettings["notifications"];
      };
      if (!response.ok || !payload.notifications) {
        throw new Error(payload.error ?? "Failed to update notifications.");
      }
      setNotifications(payload.notifications);
      setNotificationsMessage("Notification settings updated.");
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
            <Input
              value={companyProfile.companyName}
              onChange={(e) =>
                setCompanyProfile((prev) => ({
                  ...prev,
                  companyName: e.target.value,
                }))
              }
              placeholder="Company name"
            />
            <Input
              value={companyProfile.industry}
              onChange={(e) =>
                setCompanyProfile((prev) => ({
                  ...prev,
                  industry: e.target.value,
                }))
              }
              placeholder="Industry"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              value={companyProfile.website}
              onChange={(e) =>
                setCompanyProfile((prev) => ({
                  ...prev,
                  website: e.target.value,
                }))
              }
              placeholder="Website"
            />
            <Input
              value={companyProfile.hqLocation}
              onChange={(e) =>
                setCompanyProfile((prev) => ({
                  ...prev,
                  hqLocation: e.target.value,
                }))
              }
              placeholder="HQ location"
            />
          </div>
          <Textarea
            value={companyProfile.companyOverview}
            onChange={(e) =>
              setCompanyProfile((prev) => ({
                ...prev,
                companyOverview: e.target.value,
              }))
            }
            placeholder="Company overview"
            rows={4}
          />
          <Button onClick={saveCompanyProfile} disabled={companySaving}>
            {companySaving ? "Saving..." : "Save company profile"}
          </Button>
          {companyMessage ? <p className="text-sm text-emerald-400">{companyMessage}</p> : null}
          {companyError ? <p className="text-sm text-[--destructive]">{companyError}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hiring preferences</CardTitle>
          <CardDescription>Control how candidates are routed.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Checkbox
            checked={hiringPreferences.autoScoreResumes}
            onChange={(e) =>
              setHiringPreferences((prev) => ({
                ...prev,
                autoScoreResumes: e.target.checked,
              }))
            }
          >
            Auto-score resumes when applications arrive
          </Checkbox>
          <Checkbox
            checked={hiringPreferences.notifyHighMatch}
            onChange={(e) =>
              setHiringPreferences((prev) => ({
                ...prev,
                notifyHighMatch: e.target.checked,
              }))
            }
          >
            Notify me when match score exceeds 80
          </Checkbox>
          <Checkbox
            checked={hiringPreferences.allowSlotRequests}
            onChange={(e) =>
              setHiringPreferences((prev) => ({
                ...prev,
                allowSlotRequests: e.target.checked,
              }))
            }
          >
            Allow candidates to request interview time slots
          </Checkbox>
          <Button onClick={saveHiringPreferences} disabled={hiringSaving}>
            {hiringSaving ? "Saving..." : "Save preferences"}
          </Button>
          {hiringMessage ? <p className="text-sm text-emerald-400">{hiringMessage}</p> : null}
          {hiringError ? <p className="text-sm text-[--destructive]">{hiringError}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Customize alerts from Recrix.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Checkbox
            checked={notifications.dailySummaries}
            onChange={(e) =>
              setNotifications((prev) => ({
                ...prev,
                dailySummaries: e.target.checked,
              }))
            }
          >
            Email me daily pipeline summaries
          </Checkbox>
          <Checkbox
            checked={notifications.slackAlerts}
            onChange={(e) =>
              setNotifications((prev) => ({
                ...prev,
                slackAlerts: e.target.checked,
              }))
            }
          >
            Slack alerts for new applicants
          </Checkbox>
          <Checkbox
            checked={notifications.weeklyReport}
            onChange={(e) =>
              setNotifications((prev) => ({
                ...prev,
                weeklyReport: e.target.checked,
              }))
            }
          >
            Weekly hiring performance report
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
