import mongoose from "mongoose";

import { ResearchProject } from "../projects/models/research-project.model.js";

import { ResearchPlanModel } from "./models/research-plan.model.js";

import { researchPlannerGraph } from "../../agents/research-planner/research-planner.graph.js";

import { ResearchPlanSchema } from "../../agents/research-planner/research-planner.schema.js";

export async function generateAndSaveResearchPlan(
  projectId: string,
  objective: string,
) {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error("Invalid project ID");
  }

  const normalizedObjective = objective.trim();

  if (normalizedObjective.length < 10) {
    throw new Error("Research objective must contain at least 10 characters.");
  }

  const project = await ResearchProject.findOne({
    _id: projectId,
    ownerId: "local-user",
  });

  if (!project) {
    throw new Error("Research project not found");
  }

  // Execute the LangGraph workflow.
  const result = await researchPlannerGraph.invoke({
    objective: normalizedObjective,
  });

  if (!result.plan) {
    throw new Error("Research planner did not generate a plan");
  }

  // Validate again before saving.
  const validatedPlan = ResearchPlanSchema.parse(result.plan);

  const researchPlan = await ResearchPlanModel.create({
    projectId: project._id,
    objective: normalizedObjective,
    plan: validatedPlan,
    status: "active",
    retryCount: result.retryCount,
    isValid: result.isValid,
    validationErrors: result.validationErrors,
  });

  return researchPlan;
}

export async function getResearchPlans(projectId: string) {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error("Invalid project ID");
  }

  const project = await ResearchProject.findOne({
    _id: projectId,
    ownerId: "local-user",
  });

  if (!project) {
    throw new Error("Research project not found");
  }

  return ResearchPlanModel.find({
    projectId: project._id,
  }).sort({
    createdAt: -1,
  });
}

export async function getResearchPlanById(projectId: string, planId: string) {
  if (
    !mongoose.isValidObjectId(projectId) ||
    !mongoose.isValidObjectId(planId)
  ) {
    throw new Error("Invalid project or research plan ID");
  }

  const project = await ResearchProject.findOne({
    _id: projectId,
    ownerId: "local-user",
  });

  if (!project) {
    throw new Error("Research project not found");
  }

  const researchPlan = await ResearchPlanModel.findOne({
    _id: planId,
    projectId: project._id,
  });

  if (!researchPlan) {
    throw new Error("Research plan not found");
  }

  return researchPlan;
}

export async function updateResearchTaskStatus(
  projectId: string,
  planId: string,
  areaIndex: number,
  taskIndex: number,
  status: "pending" | "in_progress" | "completed",
) {
  const researchPlan = await getResearchPlanById(projectId, planId);

  const areas = researchPlan.plan.researchAreas;

  if (
    !Number.isInteger(areaIndex) ||
    !Number.isInteger(taskIndex) ||
    areaIndex < 0 ||
    taskIndex < 0 ||
    !areas[areaIndex] ||
    !areas[areaIndex].tasks[taskIndex]
  ) {
    throw new Error("Invalid research area or task index");
  }

  areas[areaIndex].tasks[taskIndex].status = status;

  researchPlan.markModified("plan");

  await researchPlan.save();

  return researchPlan;
}
