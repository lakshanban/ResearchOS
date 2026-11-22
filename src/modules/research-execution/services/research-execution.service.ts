
import mongoose from "mongoose";
import { createHash } from "node:crypto";

import { ResearchPlanModel } from "../../research-plans/models/research-plan.model";

import { ResearchExecutionModel } from "../models/research-execution.model";
import { ResearchSourceModel } from "../models/research-source.model";
import { ResearchFindingModel } from "../models/research-finding.model";

import {
  executeResearchPlan,
} from "../../../agents/research-execution/research-execution.graph";

import type {
  ResearchPlan,
} from "../../../agents/research-planner/research-planner.schema";

function createContentHash(content: string): string {
  return createHash("sha256")
    .update(content)
    .digest("hex");
}

function getPlanTasks(plan: ResearchPlan) {
  const tasks: Array<{
    areaIndex: number;
    taskIndex: number;
    areaName: string;
    title: string;
    description: string;
    priority: "low" | "medium" | "high" | "critical";
    expectedOutcome: string;
    status: "pending" | "running" | "completed" | "failed" | "skipped";
    attempts: number;
  }> = [];

  plan.researchAreas.forEach((area, areaIndex) => {
    area.tasks.forEach((task, taskIndex) => {
      if (task.status === "completed") {
        return;
      }

      tasks.push({
        areaIndex,
        taskIndex,
        areaName: area.name,
        title: task.title,
        description: task.description,
        priority: task.priority,
        expectedOutcome: task.expectedOutcome,
        status: "pending",
        attempts: 0,
      });
    });
  });

  return tasks;
}

export async function startResearchExecution(
  projectId: string,
  planId: string,
) {
  if (
    !mongoose.isValidObjectId(projectId) ||
    !mongoose.isValidObjectId(planId)
  ) {
    throw new Error("Invalid project ID or research plan ID.");
  }

  // 1. Load the research plan.
  const planDocument = await ResearchPlanModel.findOne({
    _id: planId,
    projectId,
  });

  if (!planDocument) {
    throw new Error("Research plan not found for this project.");
  }

  if (planDocument.status === "completed") {
    throw new Error("This research plan has already been completed.");
  }

  const plan = planDocument.plan as ResearchPlan;

  // 2. Prepare tasks.
  const tasks = getPlanTasks(plan);

  if (tasks.length === 0) {
    throw new Error("There are no pending tasks to execute.");
  }

  // 3. Prevent duplicate active executions for the same plan.
  const activeExecution = await ResearchExecutionModel.findOne({
    projectId,
    planId,
    status: "running",
  });

  if (activeExecution) {
    throw new Error("This research plan already has an active execution.");
  }

  // 4. Create an execution record before running the graph.
  const execution = await ResearchExecutionModel.create({
    projectId,
    planId,
    status: "running",
    tasks,
    totalTasks: tasks.length,
    completedTasks: 0,
    failedTasks: 0,
    startedAt: new Date(),
  });

  try {
    // 5. Execute the LangGraph workflow.
    const result = await executeResearchPlan(plan);

    // 6. Persist successful task results.
    for (const taskResult of result.taskResults) {
      const matchingTask = execution.tasks.find(
        (task: any) =>
          task.areaIndex === taskResult.areaIndex &&
          task.taskIndex === taskResult.taskIndex,
      );

      if (matchingTask) {
        matchingTask.status = "running";
        matchingTask.attempts += 1;
        matchingTask.startedAt = new Date();
      }

      // 7. Save sources and build URL -> MongoDB ID mapping.
      const sourceIdMap = new Map<string, mongoose.Types.ObjectId>();

      for (const source of taskResult.research.sources) {
        const savedSource = await ResearchSourceModel.findOneAndUpdate(
          {
            executionId: execution._id,
            url: source.url,
          },
          {
            $set: {
              projectId: execution.projectId,
              planId: execution.planId,
              executionId: execution._id,
              areaIndex: taskResult.areaIndex,
              taskIndex: taskResult.taskIndex,
              url: source.url,
              title: source.title,
              domain: source.domain,
              description: source.description,
              content: source.content,
              publishedAt: source.publishedAt
                ? new Date(source.publishedAt)
                : undefined,
              fetchedAt: source.fetchedAt,
              contentHash: createContentHash(source.content),
            },
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          },
        );

        sourceIdMap.set(
          source.url,
          savedSource._id as mongoose.Types.ObjectId,
        );
      }

      // 8. Save individual research findings.
      for (const claim of taskResult.evidence.claims) {
        const sourceIds = [
          ...new Set(
            claim.sourceEvidence
              .map((evidence) => sourceIdMap.get(evidence.url))
              .filter(
                (id): id is mongoose.Types.ObjectId => Boolean(id),
              ),
          ),
        ];

        if (sourceIds.length === 0) {
          continue;
        }

        await ResearchFindingModel.create({
          projectId: execution.projectId,
          planId: execution.planId,
          executionId: execution._id,
          areaIndex: taskResult.areaIndex,
          taskIndex: taskResult.taskIndex,
          claim: claim.claim,
          explanation: claim.explanation,
          confidence: claim.confidence,
          sourceIds,
        });
      }

      // 9. Update task status.
      if (matchingTask) {
        matchingTask.status = "completed";
        matchingTask.completedAt = new Date();
      }

      // Update the original Phase 5 plan task.
      await ResearchPlanModel.updateOne(
        { _id: planId, projectId },
        {
          $set: {
            [`plan.researchAreas.${taskResult.areaIndex}.tasks.${taskResult.taskIndex}.status`]:
              "completed",
          },
        },
      );
    }

    // 10. Update failed tasks.
    for (const failedTask of result.failures) {
      const matchingTask = execution.tasks.find(
        (task: any) =>
          task.areaIndex === failedTask.areaIndex &&
          task.taskIndex === failedTask.taskIndex,
      );

      if (matchingTask) {
        matchingTask.status = "failed";
        matchingTask.attempts += 1;
        matchingTask.error = failedTask.error;
        matchingTask.completedAt = new Date();
      }
    }

    // 11. Finalize the execution.
    execution.status = result.status;
    execution.completedTasks = result.completedTasks;
    execution.failedTasks = result.failedTasks;
    execution.completedAt = new Date();

    await execution.save();

    return execution;
  } catch (error) {
    execution.status = "failed";
    execution.lastError =
      error instanceof Error
        ? error.message
        : "Unknown execution error";
    execution.completedAt = new Date();

    await execution.save();

    throw error;
  }
}

export async function getResearchExecutions(projectId: string) {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error("Invalid project ID.");
  }

  return ResearchExecutionModel.find({ projectId })
    .sort({ createdAt: -1 })
    .lean();
}

export async function getResearchExecutionById(
  projectId: string,
  executionId: string,
) {
  if (
    !mongoose.isValidObjectId(projectId) ||
    !mongoose.isValidObjectId(executionId)
  ) {
    throw new Error("Invalid project ID or execution ID.");
  }

  const execution = await ResearchExecutionModel.findOne({
    _id: executionId,
    projectId,
  }).lean();

  if (!execution) {
    throw new Error("Research execution not found.");
  }

  const [sources, findings] = await Promise.all([
    ResearchSourceModel.find({
      executionId,
    }).sort({ areaIndex: 1, taskIndex: 1 }).lean(),

    ResearchFindingModel.find({
      executionId,
    }).populate("sourceIds").sort({
      areaIndex: 1,
      taskIndex: 1,
    }).lean(),
  ]);

  return {
    execution,
    sources,
    findings,
  };
}
