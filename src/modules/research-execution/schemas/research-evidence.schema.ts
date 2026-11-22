
import { z } from "zod";

export const ResearchSourceInputSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  domain: z.string().min(1),
  description: z.string().optional(),
  publishedAt: z.coerce.date().optional(),
  content: z.string().optional(),
});

export const ResearchFindingInputSchema = z.object({
  projectId: z.string().regex(/^[a-f\d]{24}$/i),
  planId: z.string().regex(/^[a-f\d]{24}$/i),
  executionId: z.string().regex(/^[a-f\d]{24}$/i),
  areaIndex: z.number().int().min(0),
  taskIndex: z.number().int().min(0),
  claim: z.string().min(10),
  explanation: z.string().min(10),
  confidence: z.number().min(0).max(1),
  sourceIds: z.array(
    z.string().regex(/^[a-f\d]{24}$/i),
  ).min(1),
});

export type ResearchSourceInput = z.infer<
  typeof ResearchSourceInputSchema
>;

export type ResearchFindingInput = z.infer<
  typeof ResearchFindingInputSchema
>;
