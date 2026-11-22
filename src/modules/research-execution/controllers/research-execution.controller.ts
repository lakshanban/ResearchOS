import type { Request, Response } from "express";

import {
  startResearchExecution,
  getResearchExecutions,
  getResearchExecutionById,
} from "../services/research-execution.service";

export async function startExecutionController(req: Request, res: Response) {
  try {
    const { projectId } = req.params;
    const { planId } = req.body;

    if (!planId || typeof planId !== "string") {
      return res.status(400).json({
        success: false,
        message: "planId is required.",
      });
    }

    const execution = await startResearchExecution(projectId as string, planId);

    return res.status(201).json({
      success: true,
      message: "Research execution completed.",
      data: execution,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to start research execution.",
    });
  }
}

export async function getExecutionsController(req: Request, res: Response) {
  try {
    const executions = await getResearchExecutions(
      req.params.projectId as string,
    );

    return res.status(200).json({
      success: true,
      data: executions,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to retrieve research executions.",
    });
  }
}

export async function getExecutionByIdController(req: Request, res: Response) {
  try {
    const result = await getResearchExecutionById(
      req.params.projectId as string,
      req.params.executionId as string,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to retrieve research execution.";

    const status = message === "Research execution not found." ? 404 : 400;

    return res.status(status).json({
      success: false,
      message,
    });
  }
}
