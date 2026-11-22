import type { ResearchPlan } from "../../research-planner/research-planner.schema";

import {
  AgentAssignmentSchema,
  type AgentAssignment,
  type ResearchAgentRole,
  type ResearchCollaborationState,
} from "../collaboration.schema";

import { researchAgentRegistry } from "../research-agent.registry";

interface CreateCollaborationInput {
  projectId: string;
  planId: string;
  executionId: string;
  objective: string;
  plan: ResearchPlan;
}

const taskRoutingRules: Array<{
  role: ResearchAgentRole;
  keywords: string[];
}> = [
  {
    role: "regulatory_research",
    keywords: [
      "regulation",
      "regulatory",
      "compliance",
      "gdpr",
      "legal",
      "law",
      "licensing",
      "privacy",
      "right to rent",
      "legislation",
    ],
  },
  {
    role: "technical_research",
    keywords: [
      "technical",
      "technology",
      "architecture",
      "implementation",
      "infrastructure",
      "ai capability",
      "integration",
      "machine learning",
      "software development",
      "technical feasibility",
    ],
  },
  {
    role: "market_research",
    keywords: [
      "market",
      "competitor",
      "competition",
      "pricing",
      "customer",
      "industry",
      "demand",
      "business opportunity",
      "market size",
      "commercial",
    ],
  },
  {
    role: "data_analysis",
    keywords: [
      "analysis",
      "analytical",
      "compare",
      "comparison",
      "patterns",
      "insights",
      "forecast",
      "evaluate findings",
      "synthesis",
    ],
  },
];

export function classifyResearchTask(
  areaName: string,
  taskTitle: string,
  description: string,
): ResearchAgentRole {
  const text = `${areaName} ${taskTitle} ${description}`.toLowerCase();

  for (const rule of taskRoutingRules) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule.role;
    }
  }

  return "market_research";
}

export function assignResearchTasks(plan: ResearchPlan): AgentAssignment[] {
  const assignments: AgentAssignment[] = [];

  plan.researchAreas.forEach((area, areaIndex) => {
    area.tasks.forEach((task, taskIndex) => {
      const agentRole = classifyResearchTask(
        area.name,
        task.title,
        task.description,
      );

      const assignment = AgentAssignmentSchema.parse({
        areaIndex,
        taskIndex,
        areaName: area.name,
        title: task.title,
        description: task.description,
        expectedOutcome: task.expectedOutcome,
        agentRole,
        status: "pending",
        attempts: 0,
      });

      assignments.push(assignment);
    });
  });

  return assignments;
}

export function createResearchCollaboration(
  input: CreateCollaborationInput,
): ResearchCollaborationState {
  if (!input.plan.researchAreas.length) {
    throw new Error("Research plan contains no research areas.");
  }

  const assignments = assignResearchTasks(input.plan);

  if (!assignments.length) {
    throw new Error("Research plan contains no executable tasks.");
  }

  return {
    projectId: input.projectId,
    planId: input.planId,
    executionId: input.executionId,
    objective: input.objective,
    planTitle: input.plan.title,
    assignments,
    findings: [],
    messages: [],
    conflicts: [],
    status: "pending",
  };
}

export function getAgentInstructions(role: ResearchAgentRole): string {
  const agent = researchAgentRegistry[role];

  return `
  You are the ${agent.name}.
  
  Your description:
  ${agent.description}
  
  Your responsibilities:
  ${agent.responsibilities.map((item) => `- ${item}`).join("\n")}
  
  Research rules:
  - Focus on your assigned research task.
  - Use evidence rather than assumptions.
  - Never invent facts, statistics, sources or URLs.
  - Clearly distinguish facts from assumptions.
  - Identify uncertainty and research gaps.
  - Return structured findings with supporting evidence.
  `;
}
