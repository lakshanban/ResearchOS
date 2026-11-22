import { llm } from "../../../../config/llm";

import type {
  AgentAssignment,
  CollaborativeFinding,
  ResearchCollaborationState,
} from "../../collaboration.schema";

import { runResearchWorker } from "../../../../modules/research-execution/services/research-worker.service";
import { extractAndValidateEvidence } from "../../../../modules/research-execution/services/research-evidence.service";

export interface SpecializedAgentResult {
  agentRole: "market_research" | "technical_research" | "regulatory_research";

  summary: string;
  findings: CollaborativeFinding[];
  errors: string[];
}

interface MarketResearchInput {
  assignment: AgentAssignment;
  objective: string;
  existingFindings?: CollaborativeFinding[];
}

export async function runMarketResearchAgent(
  input: MarketResearchInput,
): Promise<SpecializedAgentResult> {
  const { assignment, objective, existingFindings = [] } = input;

  console.log(`[Market Research Agent] Starting: ${assignment.title}`);

  const workerResult = await runResearchWorker({
    title: assignment.title,
    description: assignment.description,
    expectedOutcome: assignment.expectedOutcome,
    objective,
  } as any);

  const evidenceResult = await extractAndValidateEvidence({
    objective,
    task: assignment,
    researchResult: workerResult,
  } as any);

  const evidenceContext = JSON.stringify(evidenceResult, null, 2);

  const previousContext = existingFindings
    .map((finding) => finding.claim)
    .join("\n");

  const response = await llm.invoke([
    {
      role: "system",
      content: `
  You are the Market Research Agent in ResearchOS.
  
  Your responsibilities:
  - Investigate market opportunities.
  - Analyze market trends and demand.
  - Identify competitors.
  - Compare competitor products and pricing.
  - Identify customer pain points.
  - Discover commercial opportunities.
  
  Rules:
  - Use only the supplied research evidence.
  - Never invent market statistics.
  - Never invent competitors or URLs.
  - Distinguish facts from assumptions.
  - Identify information that needs verification.
  - Return concise, evidence-based research.
        `,
    },
    {
      role: "user",
      content: `
  Research objective:
  ${objective}
  
  Assigned task:
  ${assignment.title}
  
  Task description:
  ${assignment.description}
  
  Expected outcome:
  ${assignment.expectedOutcome}
  
  Previous findings:
  ${previousContext || "No previous findings."}
  
  Collected research evidence:
  ${evidenceContext}
  
  Analyze the evidence and provide:
  1. Research summary.
  2. Important market findings.
  3. Commercial opportunities.
  4. Research gaps.
  
  Return a structured JSON response.
        `,
    },
  ]);

  const content = String(response.content);

  return {
    agentRole: "market_research",
    summary: content,
    findings: [],
    errors: [],
  };
}
