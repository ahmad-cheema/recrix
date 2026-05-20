import { z } from "zod";

const statusSchema = z.enum([
  "submitted",
  "manual_review",
  "reviewed",
  "interview_scheduled",
  "rejected",
]);

export const inviteSchema = z.object({
  proposedTime: z.string().min(2).optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: statusSchema,
});

export const manualOverrideSchema = z.object({
  name: z.string().max(120).nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  location: z.string().max(120).nullable().optional(),
  skills: z.array(z.string().max(80)).max(30).optional(),
  experience: z.string().max(500).nullable().optional(),
  education: z.string().max(500).nullable().optional(),
});

export type InviteInput = z.infer<typeof inviteSchema>;
export type UpdateApplicationStatusInput = z.infer<
  typeof updateApplicationStatusSchema
>;
export type ManualOverrideInput = z.infer<typeof manualOverrideSchema>;
