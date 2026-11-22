import { Request, Response, NextFunction } from "express";

import { z } from "zod";

import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "./project.service";

const createProjectSchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().max(1000).optional(),
  objective: z.string().trim().min(10).max(5000),
  tags: z.array(z.string().trim()).optional(),
});

const updateProjectSchema = z
  .object({
    title: z.string().trim().min(3).max(150).optional(),
    description: z.string().max(1000).optional(),
    objective: z.string().trim().min(10).max(5000).optional(),
    status: z.enum(["draft", "active", "completed", "archived"]).optional(),
    tags: z.array(z.string().trim()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export async function createProjectController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = createProjectSchema.parse(req.body);

    const project = await createProject(input);

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProjectsController(req: Request, res: Response, next: NextFunction) {
    try {
        const projects = await getProjects();

        res.status(200).json({
            success: true,
            data: projects,
        });
    } catch (error) {
        next(error);
    }
}

export async function getProjectController(req: Request, res: Response, next: NextFunction) {
    try {
        const { projectId } = req.params;

        const project = await getProjectById(projectId as string);

        res.status(200).json({
            success: true,
            data: project,
        });
    } catch (error) {
        next(error);
    }
}

export async function updateProjectController(req: Request, res: Response, next: NextFunction) {
    try {
        const { projectId } = req.params;

        const input = updateProjectSchema.parse(req.body);

        const project = await updateProject(projectId as string, input);

        res.status(200).json({
            success: true,
            data: project,
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteProjectController(req: Request, res: Response, next: NextFunction) {
    try {
        const { projectId } = req.params;

        await deleteProject(projectId as string);

        res.status(200).json({
            success: true,
            message: "Project deleted successfully",
        });
    } catch (error) {
        next(error);
    }
}

