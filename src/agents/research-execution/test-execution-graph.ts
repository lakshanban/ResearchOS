
import type { ResearchPlan } from "../../agents/research-planner/research-planner.schema";

import {
  executeResearchPlan,
} from "./research-execution.graph";

const testPlan: ResearchPlan = {
  title: "UK Property Management SaaS Research",
  description:
    "Investigate the UK property management software market and identify opportunities for an AI-powered SaaS product.",

  researchAreas: [
    {
      name: "UK Property Management Market Analysis",
      description:
        "Understand the UK property management software market and its current opportunities.",

      tasks: [
        {
          title: "Analyze the UK property management software market",
          description:
            "Investigate market trends, software adoption, and major customer requirements in the UK.",
          priority: "high",
          expectedOutcome:
            "Identify important market trends and software adoption opportunities.",
          status: "pending",
        },
        {
          title: "Investigate property management customer challenges",
          description:
            "Identify common operational challenges faced by UK landlords and property managers.",
          priority: "medium",
          expectedOutcome:
            "Identify recurring operational problems that software could solve.",
          status: "pending",
        },
      ],
    },
  ],
};

async function main() {
  console.log("Starting ResearchOS execution workflow...");

  const result = await executeResearchPlan(testPlan);

  console.log("\n========== EXECUTION SUMMARY ==========");

  console.log(
    JSON.stringify(
      {
        status: result.status,
        totalTasks: result.totalTasks,
        completedTasks: result.completedTasks,
        failedTasks: result.failedTasks,
        failures: result.failures,
        startedAt: result.startedAt,
        completedAt: result.completedAt,
      },
      null,
      2,
    ),
  );

  console.log("\n========== RESEARCH RESULTS ==========");

  result.taskResults.forEach((task: any, index: any) => {
    console.log(`\nTask ${index + 1}: ${task.taskTitle}`);

    console.log("Sources:", task.research.sourcesFound);
    console.log("Claims:", task.evidence.totalClaims);
    console.log("Verified:", task.evidence.verifiedClaims);
    console.log("Unverified:", task.evidence.unverifiedClaims);
  });
}

main().catch((error) => {
  console.error("Execution workflow failed:", error);
  process.exitCode = 1;
});
