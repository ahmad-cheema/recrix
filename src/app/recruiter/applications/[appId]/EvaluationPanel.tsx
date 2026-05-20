"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ScoreRing,
  Spinner,
} from "@/components/ui";

type Evaluation = {
  overall_match_score: number;
  skills_match_score: number;
  experience_match_score: number;
  education_match_score: number;
  industry_relevance_score: number;
  leadership_alignment_score: number;
  communication_indicators_score: number;
  candidate_summary: string;
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  risk_factors: string[];
  career_progression_analysis: string;
  recommended_interview_questions: string[];
  hiring_recommendation:
    | "strongly_recommended"
    | "recommended"
    | "consider_with_reservations"
    | "not_recommended";
  recommendation_rationale: string;
  confidence_score: number;
  uncertainty_notes: string[];
  model: string;
  prompt_version: string;
  evaluation_version: string;
  evaluated_at: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (typeof entry === "string" ? entry : null))
    .filter((entry): entry is string => Boolean(entry));
}

function asRecommendation(value: unknown): Evaluation["hiring_recommendation"] {
  if (
    value === "strongly_recommended" ||
    value === "recommended" ||
    value === "consider_with_reservations" ||
    value === "not_recommended"
  ) {
    return value;
  }
  return "not_recommended";
}

function normalizeEvaluation(value: unknown): Evaluation | null {
  const raw = asRecord(value);
  if (!raw) {
    return null;
  }

  return {
    overall_match_score: asNumber(raw.overall_match_score),
    skills_match_score: asNumber(raw.skills_match_score),
    experience_match_score: asNumber(raw.experience_match_score),
    education_match_score: asNumber(raw.education_match_score),
    industry_relevance_score: asNumber(raw.industry_relevance_score),
    leadership_alignment_score: asNumber(raw.leadership_alignment_score),
    communication_indicators_score: asNumber(raw.communication_indicators_score),
    candidate_summary: asString(raw.candidate_summary),
    strengths: asStringArray(raw.strengths),
    weaknesses: asStringArray(raw.weaknesses),
    missing_skills: asStringArray(raw.missing_skills),
    risk_factors: asStringArray(raw.risk_factors),
    career_progression_analysis: asString(raw.career_progression_analysis),
    recommended_interview_questions: asStringArray(
      raw.recommended_interview_questions
    ),
    hiring_recommendation: asRecommendation(raw.hiring_recommendation),
    recommendation_rationale: asString(raw.recommendation_rationale),
    confidence_score: asNumber(raw.confidence_score),
    uncertainty_notes: asStringArray(raw.uncertainty_notes),
    model: asString(raw.model, "unknown"),
    prompt_version: asString(raw.prompt_version, "unknown"),
    evaluation_version: asString(raw.evaluation_version, "unknown"),
    evaluated_at: asString(raw.evaluated_at, new Date().toISOString()),
  };
}

const PIPELINE_STEPS = [
  "Extracting Resume Data",
  "Reading Job Description",
  "Comparing Skills",
  "Evaluating Experience",
  "Calculating Match Score",
  "Generating Recruiter Insights",
  "Preparing Recommendations",
];

function recommendationLabel(value: Evaluation["hiring_recommendation"]) {
  if (value === "strongly_recommended") return "Strongly Recommended";
  if (value === "recommended") return "Recommended";
  if (value === "consider_with_reservations") return "Consider with Reservations";
  return "Not Recommended";
}

function scoreBand(score: number) {
  if (score >= 80) return { label: "Strong Match", variant: "success" as const };
  if (score >= 60) return { label: "Moderate Match", variant: "warning" as const };
  return { label: "Weak Match", variant: "destructive" as const };
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return date.toLocaleString();
}

export default function EvaluationPanel({
  applicationId,
  initialEvaluation,
}: {
  applicationId: string;
  initialEvaluation: Evaluation | null;
}) {
  const [evaluation, setEvaluation] = React.useState<Evaluation | null>(
    normalizeEvaluation(initialEvaluation)
  );
  const [isRunning, setIsRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    if (!isRunning) {
      return;
    }
    const interval = setInterval(() => {
      setActiveStep((prev) => Math.min(prev + 1, PIPELINE_STEPS.length - 1));
    }, 1100);
    return () => clearInterval(interval);
  }, [isRunning]);

  async function runEvaluation() {
    setIsRunning(true);
    setError(null);
    setActiveStep(0);
    try {
      const response = await fetch(`/api/applications/${applicationId}/evaluate`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; evaluation?: unknown }
        | null;
      const normalized = normalizeEvaluation(payload?.evaluation);
      if (!response.ok || !normalized) {
        throw new Error(payload?.error ?? "Evaluation failed.");
      }
      setEvaluation(normalized);
    } catch (runError) {
      setError(
        runError instanceof Error ? runError.message : "Evaluation failed."
      );
    } finally {
      setIsRunning(false);
    }
  }

  const score = evaluation?.overall_match_score ?? null;
  const band = score != null ? scoreBand(score) : null;
  const isReRun = Boolean(evaluation);

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-indigo-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">AI Evaluation</CardTitle>
              <CardDescription className="mt-1">
                Recruiter-assisted intelligence with transparent scoring and rationale.
              </CardDescription>
            </div>
            <Button onClick={runEvaluation} disabled={isRunning}>
              {isRunning ? (
                <>
                  <Spinner size="sm" /> Running Evaluation...
                </>
              ) : isReRun ? (
                "Re-Run Evaluation"
              ) : (
                "Run AI Evaluation"
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isRunning ? (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
              <p className="text-sm font-medium text-indigo-800">
                Running staged recruiter-grade orchestration...
              </p>
              <ul className="mt-3 grid gap-2">
                {PIPELINE_STEPS.map((step, index) => (
                  <li
                    key={step}
                    className={`rounded-md px-3 py-2 text-sm ${
                      index <= activeStep
                        ? "bg-white text-indigo-700"
                        : "bg-transparent text-slate-500"
                    }`}
                  >
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {!evaluation && !isRunning ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-800">
                AI evaluation has not been run for this candidate yet.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Run AI evaluation to generate structured match scoring, recruiter
                insights, and interview recommendations.
              </p>
            </div>
          ) : null}

          <AnimatePresence>
            {evaluation ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-4"
              >
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <ScoreRing score={evaluation.overall_match_score} size={156} />
                      <div>
                        <p className="text-sm uppercase tracking-wide text-slate-500">
                          Overall Match
                        </p>
                        <p className="mt-1 text-4xl font-semibold text-slate-900">
                          {evaluation.overall_match_score}%
                        </p>
                        {band ? (
                          <Badge className="mt-2" variant={band.variant}>
                            {band.label}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>
                        Evaluated: {formatDateTime(evaluation.evaluated_at)}
                      </p>
                      <p>Model: {evaluation.model}</p>
                      <p>Prompt: {evaluation.prompt_version}</p>
                      <p>Engine v{evaluation.evaluation_version}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <ScoreMini title="Skills Match" score={evaluation.skills_match_score} />
                  <ScoreMini
                    title="Experience Match"
                    score={evaluation.experience_match_score}
                  />
                  <ScoreMini
                    title="Education Match"
                    score={evaluation.education_match_score}
                  />
                  <ScoreMini
                    title="Industry Relevance"
                    score={evaluation.industry_relevance_score}
                  />
                  <ScoreMini
                    title="Leadership Alignment"
                    score={evaluation.leadership_alignment_score}
                  />
                  <ScoreMini
                    title="Communication Indicators"
                    score={evaluation.communication_indicators_score}
                  />
                </div>

                <div className="grid gap-4">
                  <InsightCard title="Candidate Summary">
                    <p>{evaluation.candidate_summary}</p>
                  </InsightCard>
                  <InsightCard title="Strengths">
                    <ul className="list-disc space-y-1 pl-5">
                      {evaluation.strengths.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </InsightCard>
                  <InsightCard title="Weaknesses">
                    <ul className="list-disc space-y-1 pl-5">
                      {evaluation.weaknesses.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </InsightCard>
                  <InsightCard title="Missing Skills">
                    <ul className="list-disc space-y-1 pl-5">
                      {evaluation.missing_skills.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </InsightCard>
                  <InsightCard title="Risk Factors">
                    <ul className="list-disc space-y-1 pl-5">
                      {evaluation.risk_factors.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </InsightCard>
                  <InsightCard title="Career Progression Analysis">
                    <p>{evaluation.career_progression_analysis}</p>
                  </InsightCard>
                  <InsightCard title="Suggested Interview Questions">
                    <ol className="list-decimal space-y-1 pl-5">
                      {evaluation.recommended_interview_questions.map(
                        (question, index) => (
                          <li key={`${question}-${index}`}>{question}</li>
                        )
                      )}
                    </ol>
                  </InsightCard>
                  <InsightCard title="Hiring Recommendation">
                    <p className="font-medium text-slate-900">
                      {recommendationLabel(evaluation.hiring_recommendation)}
                    </p>
                    <p className="mt-2">{evaluation.recommendation_rationale}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Confidence: {evaluation.confidence_score}%
                    </p>
                  </InsightCard>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreMini({ title, score }: { title: string; score: number }) {
  const band = scoreBand(score);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{score}%</p>
      <Badge className="mt-2" variant={band.variant}>
        {band.label}
      </Badge>
    </div>
  );
}

function InsightCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
      <p className="mb-2 text-sm font-semibold text-slate-900">{title}</p>
      {children}
    </div>
  );
}
