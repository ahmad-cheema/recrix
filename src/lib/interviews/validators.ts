import { z } from "zod";

export const createInterviewSchema = z.object({
  applicationId: z.string().min(1),
});

export const answerInterviewSchema = z.object({
  questionIndex: z.number().int().min(0),
  question: z.string().min(2),
  answer: z.string().min(1),
});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
export type AnswerInterviewInput = z.infer<typeof answerInterviewSchema>;
