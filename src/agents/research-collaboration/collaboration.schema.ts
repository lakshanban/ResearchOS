import { z } from "zod";

// All available agent roles
export const ResearchAgentRoleSchema = z.enum([
  "coordinator",
  "market_research",
  "technical_research",
  "regulatory_research",
  "data_analysis",
  "quality_assurance",
]);

export type ResearchAgentRole = z.infer<typeof ResearchAgentRoleSchema>;

// Agent execution status
export const AgentExecutionStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
]);

export type AgentExecutionStatus = z.infer<typeof AgentExecutionStatusSchema>;

// Each research task assigned to an agent
export const AgentAssignmentSchema = z.object({
  areaIndex: z.number().int().nonnegative(),
  taskIndex: z.number().int().nonnegative(),

  areaName: z.string(),
  title: z.string(),
  description: z.string(),
  expectedOutcome: z.string(),

  agentRole: ResearchAgentRoleSchema,

  status: AgentExecutionStatusSchema.default("pending"),

  attempts: z.number().int().nonnegative().default(0),

  resultSummary: z.string().optional(),
  error: z.string().optional(),
});

export type AgentAssignment = z.infer<typeof AgentAssignmentSchema>;

// Findings shared between agents
export const CollaborativeFindingSchema = z.object({
  areaIndex: z.number().int().nonnegative(),
  taskIndex: z.number().int().nonnegative(),

  agentRole: ResearchAgentRoleSchema,

  claim: z.string().min(5),
  explanation: z.string().min(10),

  confidence: z.number().min(0).max(1),

  sourceUrls: z.array(z.string().url()),

  verificationStatus: z
    .enum(["unverified", "verified", "needs_review"])
    .default("unverified"),
});

export type CollaborativeFinding = z.infer<typeof CollaborativeFindingSchema>;

// Communication between agents
export const AgentMessageSchema = z.object({
  fromAgent: ResearchAgentRoleSchema,
  toAgent: ResearchAgentRoleSchema.optional(),

  messageType: z.enum([
    "observation",
    "request",
    "response",
    "conflict",
    "feedback",
  ]),

  content: z.string().min(1),

  relatedAreaIndex: z.number().int().nonnegative().optional(),
  relatedTaskIndex: z.number().int().nonnegative().optional(),

  createdAt: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
});

export type AgentMessage = z.infer<typeof AgentMessageSchema>;

// Conflicting claims that require investigation
export const ResearchConflictSchema = z.object({
  description: z.string(),

  claims: z.array(z.string()).min(2),

  sourceUrls: z.array(z.string().url()),

  status: z
    .enum(["unresolved", "resolved", "requires_human_review"])
    .default("unresolved"),

  resolution: z.string().optional(),
});

export type ResearchConflict = z.infer<typeof ResearchConflictSchema>;

// Overall multi-agent collaboration state
export const ResearchCollaborationStateSchema = z.object({
  projectId: z.string().regex(/^[a-f\d]{24}$/i),
  planId: z.string().regex(/^[a-f\d]{24}$/i),
  executionId: z.string().regex(/^[a-f\d]{24}$/i),

  objective: z.string().min(10),
  planTitle: z.string(),

  assignments: z.array(AgentAssignmentSchema),

  findings: z.array(CollaborativeFindingSchema),

  messages: z.array(AgentMessageSchema),

  conflicts: z.array(ResearchConflictSchema),

  status: z
    .enum(["pending", "running", "completed", "partially_completed", "failed"])
    .default("pending"),
});

export type ResearchCollaborationState = z.infer<
  typeof ResearchCollaborationStateSchema
>;
