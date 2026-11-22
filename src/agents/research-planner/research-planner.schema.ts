import { z } from "zod";

export const ResearchTaskSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  priority: z.enum(["low", "medium", "high", "critical"]),
  expectedOutcome: z.string().min(5),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
});

export const ResearchAreaSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  tasks: z.array(ResearchTaskSchema).min(1),
});

export const ResearchPlanSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  researchAreas: z.array(ResearchAreaSchema).min(1),
});

export type ResearchTask = z.infer<typeof ResearchTaskSchema>;
export type ResearchArea = z.infer<typeof ResearchAreaSchema>;
export type ResearchPlan = z.infer<typeof ResearchPlanSchema>;
