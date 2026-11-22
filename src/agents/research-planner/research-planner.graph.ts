import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

import { llm } from "../../config/llm";
import {
  ResearchPlanSchema,
  type ResearchPlan,
} from "./research-planner.schema";

const MAX_RETRIES = 2;

const ResearchPlannerState = Annotation.Root({
  objective: Annotation<string>(),
  plan: Annotation<ResearchPlan | null>({
    reducer: (_current, update) => update,
    default: () => null,
  }),

  validationErrors: Annotation<string[]>({
    reducer: (_current, update) => update,
    default: () => [],
  }),

  retryCount: Annotation<number>({
    reducer: (_current, update) => update,
    default: () => 0,
  }),

  isValid: Annotation<boolean>({
    reducer: (_current, update) => update,
    default: () => false,
  }),
});

const structuredPlanner = llm.withStructuredOutput(ResearchPlanSchema, {
  name: "generate_research_plan",
});

// Node 01: Generate research plan
async function plannerNode(state: typeof ResearchPlannerState.State) {
  console.log("\n[Planner]========== GENERATING RESEARCH PLAN ==========\n");

  const response = await structuredPlanner.invoke([
    {
      role: "system",
      content: `You are an expert research planning agent.

Create a comprehensive research plan.

Requirements:
- Generate 4 to 6 research areas.
- Each area should contain 2 to 4 actionable tasks.
- Tasks must be specific and measurable.
- Include priority and expected outcomes.
- Initial task status must be pending.
- Do not invent research findings or claim research has been completed.
- Return structured output only.`,
    },
    {
      role: "user",
      content: `Objective: ${state.objective}`,
    },
  ]);

  console.log(`[Planner] Generated ${response.researchAreas.length} areas.`);

  return {
    plan: response,
    validationErrors: [],
  };
}

// NODE 2: Validate plan quality
async function validationNode(state: typeof ResearchPlannerState.State) {
  console.log("\n[Validator] Checking research plan...");

  if (!state.plan) {
    return {
      isValid: false,
      validationErrors: ["Research plan is missing."],
    };
  }

  const errors: string[] = [];

  const plan = ResearchPlanSchema.safeParse(state.plan);

  if (!plan.success) {
    errors.push("Research plan does not match the schema.");
  }

  const areas = state.plan.researchAreas;

  if (areas.length < 4) {
    errors.push("At least 4 research areas are required.");
  }

  if (areas.length > 6) {
    errors.push("No more than 6 research areas are allowed.");
  }

  const allTaskTitles = areas.flatMap((area) =>
    area.tasks.map((task) => task.title.trim().toLowerCase()),
  );

  if (new Set(allTaskTitles).size !== allTaskTitles.length) {
    errors.push("Duplicate research task titles found.");
  }

  for (const area of areas) {
    if (area.tasks.length < 2) {
      errors.push(`${area.name} must contain at least 2 tasks.`);
    }

    if (area.tasks.length > 4) {
      errors.push(`${area.name} cannot contain more than 4 tasks.`);
    }
  }

  console.log(
    errors.length === 0
      ? "[Validator] Research plan is valid."
      : `[Validator] Found ${errors.length} issues.`,
  );

  return {
    isValid: errors.length === 0,
    validationErrors: errors,
  };
}

// Node 03 Refine the plan
async function refinementNode(state: typeof ResearchPlannerState.State) {
  console.log("\n[Refiner]========== REFINEING RESEARCH PLAN ==========\n");

  if (!state.plan) {
    throw new Error("Invalid research plan for refinement.");
  }

  const refinedPlan = await structuredPlanner.invoke([
    {
      role: "system",
      content: `
You are a research plan refinement agent.

Improve the supplied research plan according to the validation errors.

Rules:
- Preserve useful existing research areas and tasks.
- Remove duplicate tasks.
- Ensure there are 4 to 6 research areas.
- Ensure each area contains 2 to 4 tasks.
- Maintain actionable descriptions and expected outcomes.
- All task statuses must be pending.
- Do not claim that research has been conducted.
- Return only structured output.
      `,
    },
    {
      role: "user",
      content: JSON.stringify({
        objective: state.objective,
        currentPlan: state.plan,
        validationErrors: state.validationErrors,
      }),
    },
  ]);

  return {
    plan: refinedPlan,
    retryCount: state.retryCount + 1,
  };
}

// Node 04: Route based on validation

function validationRouter(state: typeof ResearchPlannerState.State) {
  if (state.isValid) {
    return "complete";
  }

  if (state.retryCount < MAX_RETRIES) {
    return "refine";
  }

  return "complete";
}

// Build graph
export const researchPlannerGraph = new StateGraph(ResearchPlannerState)
  .addNode("planner", plannerNode)
  .addNode("validator", validationNode)
  .addNode("refiner", refinementNode)

  .addEdge(START, "planner")
  .addEdge("planner", "validator")

  .addConditionalEdges("validator", validationRouter, { refine: "refiner", complete: END })
  .addEdge("refiner", "validator")
  .compile();
