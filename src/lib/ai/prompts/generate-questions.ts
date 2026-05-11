export const GENERATE_QUESTIONS_PROMPT = `Generate {count} interview questions for a {jobTitle} role. Mix the questions as follows:
- 40% technical
- 35% behavioural
- 25% situational

Base them on the job description provided.

Return JSON array of strings only. No markdown.`;
