import { redirect } from "next/navigation";
import { getSessionPayload } from "@/lib/auth/session";
import { getInterviewSessionForCandidate } from "@/lib/interviews/service";
import InterviewClient from "./InterviewClient";

export default async function CandidateInterviewPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const session = await getSessionPayload();

  if (!session || session.role !== "candidate") {
    redirect("/login");
  }

  const { session: interviewSession, jobTitle } =
    await getInterviewSessionForCandidate(params.sessionId, session.sub);

  const questions = (interviewSession.questions as string[] | null) ?? [];
  const answers =
    (interviewSession.answers as
      | Array<{
          questionIndex: number;
          question: string;
          answer: string;
          feedback: string;
        }>
      | null) ?? [];

  return (
    <InterviewClient
      sessionId={interviewSession.id}
      jobTitle={jobTitle}
      questions={questions}
      initialAnswers={answers}
      status={interviewSession.status}
    />
  );
}
