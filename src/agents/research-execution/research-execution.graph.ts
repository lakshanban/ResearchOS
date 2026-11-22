import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

import type {
  ResearchPlan,
  ResearchTask,
} from "./../research-planner/research-planner.schema";

import {
  runResearchWorker,
  type ResearchWorkerResult,
} from "../../modules/research-execution/services/research-worker.service";

import {
  extractAndValidateEvidence,
  type EvidenceExtractionResult,
} from "../../modules/research-execution/services/research-evidence.service";

export interface ExecutionTask {
  areaIndex: number;
  taskIndex: number;
  areaName: string;
  task: ResearchTask;
}

export interface CompletedTaskResult {
  areaIndex: number;
  taskIndex: number;
  areaName: string;
  taskTitle: string;
  status: "completed";
  research: ResearchWorkerResult;
  evidence: EvidenceExtractionResult;
}

export interface FailedTaskResult {
  areaIndex: number;
  taskIndex: number;
  areaName: string;
  taskTitle: string;
  status: "failed";
  error: string;
}

const ResearchExecutionState = Annotation.Root({
  plan: Annotation<ResearchPlan>(),

  tasks: Annotation<ExecutionTask[]>({
    reducer: (_current, update) => update,
    default: () => [],
  }),

  currentTaskIndex: Annotation<number>({
    reducer: (_current, update) => update,
    default: () => 0,
  }),

  taskResults: Annotation<CompletedTaskResult[]>({
    reducer: (_current, update) => update,
    default: () => [],
  }),

  failedTasks: Annotation<FailedTaskResult[]>({
    reducer: (_current, update) => update,
    default: () => [],
  }),

  executionStatus: Annotation<
    "pending" | "running" | "completed" | "partially_completed" | "failed"
  >({
    reducer: (_current, update) => update,
    default: () => "pending",
  }),

  startedAt: Annotation<Date>({
    reducer: (_current, update) => update,
    default: () => new Date(),
  }),

  completedAt: Annotation<Date | null>({
    reducer: (_current, update) => update,
    default: () => null,
  }),
});

type ExecutionState = typeof ResearchExecutionState.State;

// --------------------------------------------------
// NODE 1: Prepare research tasks
// --------------------------------------------------

async function prepareTasks(state: ExecutionState) {
  const tasks: ExecutionTask[] = [];

  state.plan.researchAreas.forEach((area, areaIndex) => {
    area.tasks.forEach((task, taskIndex) => {
      // Do not execute tasks already completed.
      if (task.status === "completed") {
        return;
      }

      tasks.push({
        areaIndex,
        taskIndex,
        areaName: area.name,
        task,
      });
    });
  });

  return {
    tasks,
    currentTaskIndex: 0,
    executionStatus: "running" as const,
    startedAt: new Date(),
  };
}

// --------------------------------------------------
// NODE 2: Execute one research task
// --------------------------------------------------

async function executeCurrentTask(state: ExecutionState) {
  const currentTask = state.tasks[state.currentTaskIndex];

  if (!currentTask) {
    return {};
  }

  console.log(
    `\n[ResearchOS] Executing task ${state.currentTaskIndex + 1}/${state.tasks.length}`,
  );

  console.log(`[ResearchOS] Area: ${currentTask.areaName}`);
  console.log(`[ResearchOS] Task: ${currentTask.task.title}`);

  try {
    // Step 1: Execute web research.
    const research = await runResearchWorker({
      areaName: currentTask.areaName,
      task: currentTask.task,
      searchLimit: 5,
      maxSources: 3,
    });

    console.log(`[ResearchOS] Collected ${research.sourcesFound} sources.`);

    // Step 2: Extract and validate evidence.
    const evidence = await extractAndValidateEvidence(
      research.sources.map((source) => ({
        url: source.url,
        title: source.title,
        domain: source.domain,
        content: source.content,
      })),
    );

    console.log(`[ResearchOS] Extracted ${evidence.totalClaims} claims.`);

    const result: CompletedTaskResult = {
      areaIndex: currentTask.areaIndex,
      taskIndex: currentTask.taskIndex,
      areaName: currentTask.areaName,
      taskTitle: currentTask.task.title,
      status: "completed",
      research,
      evidence,
    };

    return {
      taskResults: [...state.taskResults, result],
      currentTaskIndex: state.currentTaskIndex + 1,
    };
  } catch (error) {
    const failure: FailedTaskResult = {
      areaIndex: currentTask.areaIndex,
      taskIndex: currentTask.taskIndex,
      areaName: currentTask.areaName,
      taskTitle: currentTask.task.title,
      status: "failed",
      error:
        error instanceof Error
          ? error.message
          : "Unknown research execution error",
    };

    console.error(
      `[ResearchOS] Task failed: ${failure.taskTitle}`,
      failure.error,
    );

    // Continue to the next task even if this one fails.
    return {
      failedTasks: [...state.failedTasks, failure],
      currentTaskIndex: state.currentTaskIndex + 1,
    };
  }
}

// --------------------------------------------------
// NODE 3: Finalize execution
// --------------------------------------------------

async function finalizeExecution(state: ExecutionState) {
  const totalTasks = state.tasks.length;
  const completedTasks = state.taskResults.length;
  const failedTasks = state.failedTasks.length;

  let executionStatus: "completed" | "partially_completed" | "failed";

  if (failedTasks === 0) {
    executionStatus = "completed";
  } else if (completedTasks === 0) {
    executionStatus = "failed";
  } else {
    executionStatus = "partially_completed";
  }

  console.log("\n[ResearchOS] Execution finished.");
  console.log(`[ResearchOS] Total tasks: ${totalTasks}`);
  console.log(`[ResearchOS] Completed: ${completedTasks}`);
  console.log(`[ResearchOS] Failed: ${failedTasks}`);
  console.log(`[ResearchOS] Status: ${executionStatus}`);

  return {
    executionStatus,
    completedAt: new Date(),
  };
}

// --------------------------------------------------
// CONDITIONAL ROUTING
// --------------------------------------------------

function routePreparedTasks(state: ExecutionState) {
  return state.tasks.length > 0 ? "execute" : "finalize";
}

function routeNextTask(state: ExecutionState) {
  return state.currentTaskIndex < state.tasks.length ? "execute" : "finalize";
}

// --------------------------------------------------
// LANGGRAPH WORKFLOW
// --------------------------------------------------

const executionWorkflow = new StateGraph(ResearchExecutionState)
  .addNode("prepareTasks", prepareTasks)
  .addNode("executeCurrentTask", executeCurrentTask)
  .addNode("finalizeExecution", finalizeExecution)

  .addEdge(START, "prepareTasks")

  .addConditionalEdges("prepareTasks", routePreparedTasks, {
    execute: "executeCurrentTask",
    finalize: "finalizeExecution",
  })

  .addConditionalEdges("executeCurrentTask", routeNextTask, {
    execute: "executeCurrentTask",
    finalize: "finalizeExecution",
  })

  .addEdge("finalizeExecution", END);

export const researchExecutionGraph = executionWorkflow.compile();

// --------------------------------------------------
// PUBLIC EXECUTION FUNCTION
// --------------------------------------------------

export async function executeResearchPlan(plan: ResearchPlan) {
  const result = await researchExecutionGraph.invoke({
    plan,
  });

  return {
    status: result.executionStatus,
    totalTasks: result.tasks.length,
    completedTasks: result.taskResults.length,
    failedTasks: result.failedTasks.length,
    taskResults: result.taskResults,
    failures: result.failedTasks,
    startedAt: result.startedAt,
    completedAt: result.completedAt,
  };
}
