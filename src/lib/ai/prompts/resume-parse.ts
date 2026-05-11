export const RESUME_PARSE_PROMPT = `You are a resume parser. Extract the candidate data from the provided resume text.

Return valid JSON only. No markdown.

Required JSON shape:
{
  "name": string | null,
  "email": string | null,
  "phone": string | null,
  "skills": string[],
  "work_experience": Array<{
    "company": string | null,
    "title": string | null,
    "duration": string | null,
    "description": string | null
  }>,
  "education": string[],
  "certifications": string[]
}

If a field is not found, use null or an empty array.
Do not invent companies, dates, or degrees.`;
