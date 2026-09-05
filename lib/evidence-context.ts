import { z } from "zod";

export const contextSubmissionSchema = z.object({
  evidenceId: z.string().uuid(),
  purpose: z.string().trim().min(10).max(1000),
  role: z.string().trim().min(3).max(500),
  actions: z.string().trim().min(10).max(2000),
  outcome: z.string().trim().min(3).max(1000),
});

export type ContextSubmission = z.infer<typeof contextSubmissionSchema>;
