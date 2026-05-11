"use client";

import * as React from "react";
import { useCompletion } from "ai/react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ProgressBar,
  Spinner,
  Textarea,
} from "@/components/ui";

const entryMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

type AnswerEntry = {
  questionIndex: number;
  question: string;
  answer: string;
  feedback: string;
};

export default function InterviewClient({
  sessionId,
  jobTitle,
  questions,
  initialAnswers,
  status,
}: {
  sessionId: string;
  jobTitle: string;
  questions: string[];
  initialAnswers: AnswerEntry[];
  status: string;
}) {
  const [answers, setAnswers] = React.useState<AnswerEntry[]>(initialAnswers);
  const [currentIndex, setCurrentIndex] = React.useState(initialAnswers.length);
  const [answer, setAnswer] = React.useState("");
  const [showSummary, setShowSummary] = React.useState(
    status === "completed"
  );
  const [showNext, setShowNext] = React.useState(false);

  const { completion, isLoading, complete, setCompletion } = useCompletion({
    api: `/api/interviews/${sessionId}/answer`,
    onFinish: (_prompt, response) => {
      const currentQuestion = questions[currentIndex];
      const feedback = response.trim();

      setAnswers((prev) => [
        ...prev,
        {
          questionIndex: currentIndex,
          question: currentQuestion,
          answer,
          feedback,
        },
      ]);
      setShowNext(true);
    },
  });

  React.useEffect(() => {
    if (currentIndex >= questions.length && questions.length > 0) {
      setShowSummary(true);
    }
  }, [currentIndex, questions.length]);

  function handleSubmit() {
    const question = questions[currentIndex];
    if (!question || !answer.trim()) {
      return;
    }

    setShowNext(false);
    setCompletion("");
    complete(answer.trim(), {
      body: {
        questionIndex: currentIndex,
        question,
        answer: answer.trim(),
      },
    });
  }

  function goToNext() {
    setAnswer("");
    setCompletion("");
    setShowNext(false);
    setCurrentIndex((prev) => prev + 1);
  }

  const progress =
    questions.length > 0
      ? Math.round((Math.min(currentIndex, questions.length) / questions.length) * 100)
      : 0;

  if (showSummary) {
    return (
      <div className="min-h-screen bg-[--background] px-6 py-10 text-[--text-primary]">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold">Session summary</h1>
            <p className="mt-2 text-sm text-[--text-secondary]">
              {jobTitle}
            </p>
          </div>

          <div className="grid gap-4">
            {answers.map((entry) => (
              <details
                key={`${entry.questionIndex}-${entry.question}`}
                className="rounded-lg border border-[--border] bg-[--surface] px-4 py-3"
              >
                <summary className="cursor-pointer text-sm font-medium text-[--text-primary]">
                  {entry.question}
                </summary>
                <div className="mt-3 text-sm text-[--text-secondary]">
                  <p className="text-xs uppercase tracking-wide text-[--text-muted]">
                    Your answer
                  </p>
                  <p className="mt-1">{entry.answer}</p>
                  <p className="mt-3 text-xs uppercase tracking-wide text-[--text-muted]">
                    Feedback
                  </p>
                  <p className="mt-1">{entry.feedback}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--background] px-6 py-10 text-[--text-primary]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6" {...entryMotion}>
        <div>
          <p className="text-sm text-[--text-secondary]">{jobTitle}</p>
          <h1 className="text-2xl font-semibold">Mock interview</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Question {Math.min(currentIndex + 1, questions.length)} of {questions.length}
            </CardTitle>
            <CardDescription>{questions[currentIndex]}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Write your answer here..."
            />
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? <Spinner size="sm" /> : "Submit answer"}
            </Button>

            {completion ? (
              <div className="rounded-lg border border-[--border] bg-[--surface-raised] px-4 py-3 text-sm text-[--text-secondary]">
                {completion}
              </div>
            ) : null}

            {showNext ? (
              <Button variant="ghost" onClick={goToNext}>
                Next question
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <ProgressBar value={progress} />
      </div>
    </div>
  );
}
