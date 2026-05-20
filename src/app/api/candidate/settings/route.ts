import { NextResponse } from "next/server";
import { AppError } from "@/lib/auth/errors";
import { getSessionPayload } from "@/lib/auth/session";
import {
  getCandidateSettings,
  updateCandidateAccountSettings,
  updateCandidateNotificationSettings,
} from "@/lib/users/service";
import type { CandidateNotificationSettings } from "@/lib/users/types";

function isCandidateNotifications(
  value: unknown
): value is CandidateNotificationSettings {
  if (!value || typeof value !== "object") {
    return false;
  }
  const input = value as Record<string, unknown>;
  return (
    typeof input.interviewInvites === "boolean" &&
    typeof input.weeklyUpdates === "boolean" &&
    typeof input.smsReminders === "boolean"
  );
}

export async function GET() {
  const session = await getSessionPayload();

  if (!session || session.role !== "candidate") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const settings = await getCandidateSettings(session.sub);
    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json({ error: "Failed to load settings." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSessionPayload();

  if (!session || session.role !== "candidate") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const payload = (body ?? {}) as
    | {
        action: "account";
        email?: string;
        newPassword?: string;
      }
    | {
        action: "notifications";
        notifications?: {
          interviewInvites?: boolean;
          weeklyUpdates?: boolean;
          smsReminders?: boolean;
        };
      };

  try {
    if (payload.action === "account") {
      const account = await updateCandidateAccountSettings({
        userId: session.sub,
        email: payload.email,
        newPassword: payload.newPassword,
      });
      return NextResponse.json({ account }, { status: 200 });
    }

    if (payload.action === "notifications") {
      const notifications = payload.notifications;
      if (!isCandidateNotifications(notifications)) {
        return NextResponse.json(
          { error: "Invalid notification settings." },
          { status: 400 }
        );
      }

      const updated = await updateCandidateNotificationSettings(
        session.sub,
        notifications
      );
      return NextResponse.json({ notifications: updated }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Failed to update settings." },
      { status: 500 }
    );
  }
}
