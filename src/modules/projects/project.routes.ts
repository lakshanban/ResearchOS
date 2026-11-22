import { Router } from "express";

import {
  createProjectController,
  getProjectsController,
  getProjectController,
  updateProjectController,
  deleteProjectController,
} from "./project.controller";

import sessionRoutes from "./session.routes.js";
import documentRoutes from "../documents/document.routes.js";
import researchPlanRoutes from "../research-plans/research-plan.routes.js";

const router = Router();

router.post("/", createProjectController);
router.get("/", getProjectsController);
router.get("/:projectId", getProjectController);
router.patch("/:projectId", updateProjectController);
router.delete("/:projectId", deleteProjectController);

router.use("/:projectId/sessions", sessionRoutes);
router.use("/:projectId/documents", documentRoutes);
router.use("/:projectId/research-plans", researchPlanRoutes);

export default router;
