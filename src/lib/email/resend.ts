import "server-only";

import { Resend } from "resend";
import { AppError } from "@/lib/auth/errors";

export type InterviewInvitePayload = {
  to: string;
  candidateName: string;
  recruiterName: string;
  jobTitle: string;
  interviewLink: string;
  proposedTime?: string | null;
};

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new AppError("INTERNAL_ERROR", "Missing Resend API key.", 500);
  }
  return new Resend(apiKey);
}

function getFromAddress(): string {
  const from = process.env.RESEND_FROM;
  if (!from) {
    throw new AppError("INTERNAL_ERROR", "Missing Resend from address.", 500);
  }
  return from;
}

export async function sendInterviewInviteEmail(
  payload: InterviewInvitePayload
): Promise<void> {
  const resend = getResendClient();
  const from = getFromAddress();
  const proposedTime = payload.proposedTime?.trim() || "To be scheduled";

  const text = `Hi ${payload.candidateName},\n\nYou have been invited to interview for the ${payload.jobTitle} role by ${payload.recruiterName}.\n\nProposed time: ${proposedTime}\nMock interview link: ${payload.interviewLink}\n\nIf you have questions, reply to this email.\n\n- Recrix`;

  const result = await resend.emails.send({
    from,
    to: payload.to,
    subject: `Interview invitation - ${payload.jobTitle}`,
    text,
  });

  if (result.error) {
    throw new AppError("INTERNAL_ERROR", "Failed to send invite email.", 500);
  }
}
