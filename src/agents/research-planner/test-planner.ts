
import {
  researchPlannerGraph,
} from "./research-planner.graph.js";

async function testPlanner() {
  const result = await researchPlannerGraph.invoke({
    objective:
      "Investigate opportunities for building an AI-powered property management SaaS product in the UK.",
  });

  console.log("\n========== FINAL RESEARCH PLAN ==========\n");

  console.log(
    JSON.stringify(result.plan, null, 2)
  );

  console.log("\n========== EXECUTION SUMMARY ==========\n");

  console.log("Research areas:", result.plan?.researchAreas.length);

  console.log(
    "Total tasks:",
    result.plan?.researchAreas.reduce(
      (total, area) => total + area.tasks.length,
      0
    )
  );

  console.log("Valid:", result.isValid);
  console.log("Retries:", result.retryCount);
  console.log("Validation errors:", result.validationErrors);
}

testPlanner().catch((error) => {
  console.error("Research planner failed:", error);
  process.exit(1);
});
