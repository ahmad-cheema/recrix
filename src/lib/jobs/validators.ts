import { z } from "zod";

const statusSchema = z.enum(["draft", "active", "closed"]);
const skillSchema = z.string().min(1);

export const createJobSchema = z.object({
  title: z.string().min(2),
  department: z.string().min(2),
  location: z.string().min(2),
  employmentType: z.string().min(2),
  requiredSkills: z.array(skillSchema).min(1),
  preferredSkills: z.array(skillSchema).optional(),
  experienceLevel: z.string().min(2),
  description: z.string().min(20),
  status: statusSchema.optional(),
});

export const updateJobSchema = createJobSchema.partial().extend({
  status: statusSchema.optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
