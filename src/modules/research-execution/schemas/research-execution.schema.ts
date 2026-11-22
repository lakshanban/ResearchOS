
import { z } from "zod";

export const ExecutionTaskStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "skipped",
]);

export const ResearchExecutionStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "partially_completed",
  "failed",
  "cancelled",
]);

export const ExecutionTaskSchema = z.object({
  areaIndex: z.number().int().min(0),
  taskIndex: z.number().int().min(0),
  areaName: z.string().min(1),
  title: z.string().min(5),
  description: z.string().min(10),
  priority: z.enum(["low", "medium", "high", "critical"]),
  expectedOutcome: z.string().min(5),
  status: ExecutionTaskStatusSchema.default("pending"),
  attempts: z.number().int().min(0).default(0),
  error: z.string().optional(),
  startedAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
});

export const CreateResearchExecutionSchema = z.object({
  projectId: z.string().regex(/^[a-f\d]{24}$/i),
  planId: z.string().regex(/^[a-f\d]{24}$/i),
});

export type ExecutionTask = z.infer<typeof ExecutionTaskSchema>;

export type ExecutionTaskStatus = z.infer<
  typeof ExecutionTaskStatusSchema
>;

export type ResearchExecutionStatus = z.infer<
  typeof ResearchExecutionStatusSchema
>;

export type CreateResearchExecutionInput = z.infer<
  typeof CreateResearchExecutionSchema
>;

