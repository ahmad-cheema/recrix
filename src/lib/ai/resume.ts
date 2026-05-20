import "server-only";

import { AppError } from "@/lib/auth/errors";
import { requestOpenAiJson } from "./openai";
import { RESUME_PARSE_PROMPT } from "./prompts/resume-parse";
import { SCORE_APPLICATION_PROMPT } from "./prompts/score-application";

export type ParsedResume = {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  portfolio: string | null;
  summary: string | null;
  total_years_experience: number | null;
  skills: string[];
  technical_skills: string[];
  soft_skills: string[];
  tools: string[];
  languages: string[];
  work_experience: Array<{
    company: string | null;
    title: string | null;
    duration: string | null;
    start_date: string | null;
    end_date: string | null;
    is_current: boolean;
    description: string | null;
    achievements: string[];
    technologies_used: string[];
  }>;
  education: Array<{
    institution: string | null;
    degree: string | null;
    field: string | null;
    year: string | null;
    gpa: string | null;
  }>;
  certifications: Array<{
    name: string;
    issuer: string | null;
    year: string | null;
  }>;
  projects: Array<{
    name: string;
    description: string | null;
    technologies: string[];
  }>;
};

export type SkillMatchResult = {
  matched: string[];
  missing: string[];
  bonus: string[];
};

export type ScoringResult = {
  score: number;
  riskEvaluation: string;
  skillMatch: SkillMatchResult;
  strengths: string[];
  concerns: string[];
  experienceFit: string;
  recommendation: "strong_yes" | "yes" | "maybe" | "no";
};

export type JobSummary = {
  title: string;
  department: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[] | null;
};

export async function parseResumeText(text: string): Promise<ParsedResume> {
  const messages = [
    { role: "system" as const, content: RESUME_PARSE_PROMPT },
    { role: "user" as const, content: text },
  ];

  const result = await requestOpenAiJson<ParsedResume>(messages);

  if (!result || !Array.isArray(result.skills)) {
    throw new AppError("INTERNAL_ERROR", "Invalid resume parse output.", 500);
  }

  // Normalize: ensure all array fields are arrays
  return {
    name: result.name ?? null,
    email: result.email ?? null,
    phone: result.phone ?? null,
    location: result.location ?? null,
    linkedin: result.linkedin ?? null,
    portfolio: result.portfolio ?? null,
    summary: result.summary ?? null,
    total_years_experience: result.total_years_experience ?? null,
    skills: Array.isArray(result.skills) ? result.skills : [],
    technical_skills: Array.isArray(result.technical_skills)
      ? result.technical_skills
      : [],
    soft_skills: Array.isArray(result.soft_skills) ? result.soft_skills : [],
    tools: Array.isArray(result.tools) ? result.tools : [],
    languages: Array.isArray(result.languages) ? result.languages : [],
    work_experience: Array.isArray(result.work_experience)
      ? result.work_experience.map((exp) => ({
          company: exp.company ?? null,
          title: exp.title ?? null,
          duration: exp.duration ?? null,
          start_date: exp.start_date ?? null,
          end_date: exp.end_date ?? null,
          is_current: Boolean(exp.is_current),
          description: exp.description ?? null,
          achievements: Array.isArray(exp.achievements)
            ? exp.achievements
            : [],
          technologies_used: Array.isArray(exp.technologies_used)
            ? exp.technologies_used
            : [],
        }))
      : [],
    education: Array.isArray(result.education)
      ? result.education.map((edu) =>
          typeof edu === "string"
            ? {
                institution: null,
                degree: edu,
                field: null,
                year: null,
                gpa: null,
              }
            : {
                institution: edu.institution ?? null,
                degree: edu.degree ?? null,
                field: edu.field ?? null,
                year: edu.year ?? null,
                gpa: edu.gpa ?? null,
              }
        )
      : [],
    certifications: Array.isArray(result.certifications)
      ? result.certifications.map((cert) =>
          typeof cert === "string"
            ? { name: cert, issuer: null, year: null }
            : {
                name: cert.name ?? "",
                issuer: cert.issuer ?? null,
                year: cert.year ?? null,
              }
        )
      : [],
    projects: Array.isArray(result.projects)
      ? result.projects.map((proj) => ({
          name: proj.name ?? "",
          description: proj.description ?? null,
          technologies: Array.isArray(proj.technologies)
            ? proj.technologies
            : [],
        }))
      : [],
  };
}

export async function scoreApplication(
  parsedResume: ParsedResume,
  job: JobSummary
): Promise<ScoringResult> {
  const messages = [
    { role: "system" as const, content: SCORE_APPLICATION_PROMPT },
    {
      role: "user" as const,
      content: JSON.stringify({ resume: parsedResume, job }),
    },
  ];

  const result = await requestOpenAiJson<ScoringResult>(messages);

  if (!result) {
    throw new AppError("INTERNAL_ERROR", "Invalid score output.", 500);
  }

  const score = Number.isFinite(result.score)
    ? Math.min(100, Math.max(0, Math.round(result.score)))
    : 0;
  const riskEvaluation = result.riskEvaluation?.trim();

  if (!riskEvaluation) {
    throw new AppError("INTERNAL_ERROR", "Invalid score output.", 500);
  }

  return {
    score,
    riskEvaluation,
    skillMatch: {
      matched: Array.isArray(result.skillMatch?.matched)
        ? result.skillMatch.matched
        : [],
      missing: Array.isArray(result.skillMatch?.missing)
        ? result.skillMatch.missing
        : [],
      bonus: Array.isArray(result.skillMatch?.bonus)
        ? result.skillMatch.bonus
        : [],
    },
    strengths: Array.isArray(result.strengths) ? result.strengths : [],
    concerns: Array.isArray(result.concerns) ? result.concerns : [],
    experienceFit: result.experienceFit ?? "",
    recommendation: ["strong_yes", "yes", "maybe", "no"].includes(
      result.recommendation
    )
      ? result.recommendation
      : "maybe",
  };
}
