
import {
    classifyResearchTask,
    assignResearchTasks,
    createResearchCollaboration,
  } from "./agents/research-coordinator.agent";
  
  import type { ResearchPlan } from "../research-planner/research-planner.schema";
  
  const samplePlan: ResearchPlan = {
    title: "UK Property Management SaaS Research",
    description:
      "Investigate opportunities for an AI-powered property management SaaS product in the UK.",
    researchAreas: [
      {
        name: "UK Property Management Market Analysis",
        description: "Investigate the UK property management market.",
        tasks: [
          {
            title: "Analyze UK market size",
            description: "Research market size and industry trends.",
            priority: "high",
            expectedOutcome: "Understand market opportunities.",
            status: "pending",
          },
          {
            title: "Analyze competitor pricing",
            description: "Compare pricing across competing platforms.",
            priority: "high",
            expectedOutcome: "Create a competitor pricing comparison.",
            status: "pending",
          },
        ],
      },
      {
        name: "Regulatory and Compliance Landscape",
        description: "Investigate applicable regulations.",
        tasks: [
          {
            title: "Investigate UK GDPR requirements",
            description: "Identify relevant data protection obligations.",
            priority: "critical",
            expectedOutcome: "Identify compliance requirements.",
            status: "pending",
          },
        ],
      },
      {
        name: "Technical Implementation Requirements",
        description: "Investigate technical feasibility.",
        tasks: [
          {
            title: "Evaluate AI technology options",
            description: "Evaluate technologies for AI-powered property management.",
            priority: "high",
            expectedOutcome: "Identify feasible AI technologies.",
            status: "pending",
          },
        ],
      },
    ],
  };
  
  const assignments = assignResearchTasks(samplePlan);
  
  console.log("\n--- Coordinator Task Assignments ---\n");
  
  for (const assignment of assignments) {
    console.log(`${assignment.title} => ${assignment.agentRole}`);
  }
  
  const collaboration = createResearchCollaboration({
    projectId: "6afd80e42c7be76fc4acc0ba",
    planId: "6afd80e42c7be76fc4acc0ba",
    executionId: "6afd80e42c7be76fc4acc0ba",
    objective: "Investigate opportunities for an AI-powered property management SaaS product in the UK.",
    plan: samplePlan,
  });
  
  console.log("\n--- Collaboration Summary ---\n");
  
  console.log({
    planTitle: collaboration.planTitle,
    status: collaboration.status,
    totalAssignments: collaboration.assignments.length,
    assignmentsByAgent: collaboration.assignments.reduce(
      (result, assignment) => {
        result[assignment.agentRole] =
          (result[assignment.agentRole] || 0) + 1;
  
        return result;
      },
      {} as Record<string, number>,
    ),
  });
  
  console.log("\n--- Routing Checks ---\n");
  
  console.log(
    "GDPR:",
    classifyResearchTask("Compliance", "GDPR requirements", "Data privacy"),
  );
  
  console.log(
    "Architecture:",
    classifyResearchTask("Technical", "System architecture", "Evaluate infrastructure"),
  );
  
