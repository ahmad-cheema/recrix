import { NextResponse } from "next/server";
import { AppError } from "@/lib/auth/errors";
import { getSessionPayload } from "@/lib/auth/session";
import {
  getRecruiterSettings,
  updateRecruiterCompanyProfile,
  updateRecruiterHiringPreferences,
  updateRecruiterNotificationSettings,
} from "@/lib/users/service";
import type {
  RecruiterHiringPreferences,
  RecruiterNotificationSettings,
} from "@/lib/users/types";

function isRecruiterHiringPreferences(
  value: unknown
): value is RecruiterHiringPreferences {
  if (!value || typeof value !== "object") {
    return false;
  }
  const input = value as Record<string, unknown>;
  return (
    typeof input.autoScoreResumes === "boolean" &&
    typeof input.notifyHighMatch === "boolean" &&
    typeof input.allowSlotRequests === "boolean"
  );
}

function isRecruiterNotifications(
  value: unknown
): value is RecruiterNotificationSettings {
  if (!value || typeof value !== "object") {
    return false;
  }
  const input = value as Record<string, unknown>;
  return (
    typeof input.dailySummaries === "boolean" &&
    typeof input.slackAlerts === "boolean" &&
    typeof input.weeklyReport === "boolean"
  );
}

export async function GET() {
  const session = await getSessionPayload();

  if (!session || session.role !== "recruiter") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const settings = await getRecruiterSettings(session.sub);
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

  if (!session || session.role !== "recruiter") {
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
        action: "company";
        companyProfile?: {
          companyName?: string | null;
          industry?: string | null;
          website?: string | null;
          hqLocation?: string | null;
          companyOverview?: string | null;
        };
      }
    | {
        action: "hiring";
        hiringPreferences?: {
          autoScoreResumes?: boolean;
          notifyHighMatch?: boolean;
          allowSlotRequests?: boolean;
        };
      }
    | {
        action: "notifications";
        notifications?: {
          dailySummaries?: boolean;
          slackAlerts?: boolean;
          weeklyReport?: boolean;
        };
      };

  try {
    if (payload.action === "company") {
      const company = await updateRecruiterCompanyProfile(
        session.sub,
        payload.companyProfile ?? {}
      );
      return NextResponse.json({ companyProfile: company }, { status: 200 });
    }

    if (payload.action === "hiring") {
      const hiring = payload.hiringPreferences;
      if (!isRecruiterHiringPreferences(hiring)) {
        return NextResponse.json(
          { error: "Invalid hiring preferences." },
          { status: 400 }
        );
      }
      const updated = await updateRecruiterHiringPreferences(session.sub, hiring);
      return NextResponse.json({ hiringPreferences: updated }, { status: 200 });
    }

    if (payload.action === "notifications") {
      const notifications = payload.notifications;
      if (!isRecruiterNotifications(notifications)) {
        return NextResponse.json(
          { error: "Invalid notification settings." },
          { status: 400 }
        );
      }
      const updated = await updateRecruiterNotificationSettings(
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
