import type { Request, Response, NextFunction } from "express";
import { executeResearchQuery } from "./research.service";

export async function researchController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "Query is required and must be a string" });
      return;
    }

    const result = await executeResearchQuery(query);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
