import type { Request, Response, NextFunction } from "express";

import { z } from "zod";

import {
  createResearchSession,
  getResearchSessions,
} from "./session.service.js";

const createSessionSchema = z.object({
  query: z.string().trim().min(10).max(5000),
});

export async function createSessionController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = createSessionSchema.parse(req.body);

    const session = await createResearchSession(
      req.params.projectId as string,
      input,
    );

    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSessionsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const sessions = await getResearchSessions(req.params.projectId as string);

    res.json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
}
