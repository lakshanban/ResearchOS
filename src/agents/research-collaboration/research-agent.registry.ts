import type { ResearchAgentRole } from "./collaboration.schema";

export interface ResearchAgentDefinition {
  name: string;
  description: string;
  responsibilities: string[];
  canSearchWeb: boolean;
  canAnalyzeEvidence: boolean;
}

export const researchAgentRegistry: Record<
  ResearchAgentRole,
  ResearchAgentDefinition
> = {
  coordinator: {
    name: "Research Coordinator",
    description: "Coordinates the multi-agent research workflow.",
    responsibilities: [
      "Understand the research objective",
      "Assign tasks to specialized agents",
      "Manage agent execution",
      "Collect research results",
      "Coordinate final validation",
    ],
    canSearchWeb: false,
    canAnalyzeEvidence: true,
  },

  market_research: {
    name: "Market Research Agent",
    description:
      "Investigates markets, competitors and commercial opportunities.",
    responsibilities: [
      "Analyze market size and trends",
      "Identify competitors",
      "Compare competitor products and pricing",
      "Identify customer needs",
      "Find commercial opportunities",
    ],
    canSearchWeb: true,
    canAnalyzeEvidence: true,
  },

  technical_research: {
    name: "Technical Research Agent",
    description:
      "Investigates technical feasibility and implementation approaches.",
    responsibilities: [
      "Evaluate technology options",
      "Investigate AI capabilities",
      "Evaluate system architecture",
      "Identify technical limitations",
      "Estimate implementation complexity",
    ],
    canSearchWeb: true,
    canAnalyzeEvidence: true,
  },

  regulatory_research: {
    name: "Regulatory Research Agent",
    description: "Investigates legal, regulatory and compliance requirements.",
    responsibilities: [
      "Identify applicable regulations",
      "Investigate data protection requirements",
      "Identify compliance risks",
      "Find authoritative regulatory sources",
      "Summarize relevant obligations",
    ],
    canSearchWeb: true,
    canAnalyzeEvidence: true,
  },

  data_analysis: {
    name: "Data Analysis Agent",
    description: "Analyzes findings collected by specialist agents.",
    responsibilities: [
      "Identify patterns across findings",
      "Compare research evidence",
      "Identify market opportunities",
      "Identify gaps in collected information",
      "Generate evidence-based insights",
    ],
    canSearchWeb: false,
    canAnalyzeEvidence: true,
  },

  quality_assurance: {
    name: "Quality Assurance Agent",
    description: "Reviews research quality and validates evidence.",
    responsibilities: [
      "Check source credibility",
      "Identify unsupported claims",
      "Review confidence levels",
      "Detect conflicting findings",
      "Recommend corrections",
    ],
    canSearchWeb: true,
    canAnalyzeEvidence: true,
  },
};
