import { z } from "zod";

export const inviteSchema = z.object({
  proposedTime: z.string().min(2).optional(),
});

export type InviteInput = z.infer<typeof inviteSchema>;
