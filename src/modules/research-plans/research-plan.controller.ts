import type { Request, Response, NextFunction } from "express";

import {
  generateAndSaveResearchPlan,
  getResearchPlans,
  getResearchPlanById,
  updateResearchTaskStatus,
} from "./research-plan.service.js";

export async function generateResearchPlanController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { projectId } = req.params;
    const { objective } = req.body;

    if (typeof objective !== "string" || objective.trim().length < 10) {
      res.status(400).json({
        success: false,
        message: "A valid research objective is required.",
      });
      return;
    }

    const researchPlan = await generateAndSaveResearchPlan(
      projectId as string,
      objective,
    );

    res.status(201).json({
      success: true,
      message: "Research plan generated and saved successfully.",
      data: researchPlan,
    });
  } catch (error) {
    next(error);
  }
}

export async function getResearchPlansController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { projectId } = req.params;

    const researchPlans = await getResearchPlans(projectId as string);

    res.status(200).json({
      success: true, 
      data: researchPlans,
    });
  } catch (error) {
    next(error);
  }
}

export async function getResearchPlanController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { projectId, planId } = req.params;

    const researchPlan = await getResearchPlanById(projectId as string, planId as string);

    res.status(200).json({
      success: true,
      data: researchPlan,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateResearchTaskStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { projectId, planId } = req.params;

    const { areaIndex, taskIndex, status } = req.body;

    const allowedStatuses = ["pending", "in_progress", "completed"];

    if (
      !Number.isInteger(areaIndex) ||
      !Number.isInteger(taskIndex) ||
      !allowedStatuses.includes(status)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid task update payload.",
      });
      return;
    }

    const researchPlan = await updateResearchTaskStatus(
      projectId as string,
      planId as string,
      areaIndex,
      taskIndex,
      status,
    );

    res.status(200).json({
      success: true,
      message: "Research task updated successfully.",
      data: researchPlan,
    });
  } catch (error) {
    next(error);
  }
}
