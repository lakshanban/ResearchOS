
import { Router } from "express";

import {
  generateResearchPlanController,
  getResearchPlansController,
  getResearchPlanController,
  updateResearchTaskStatusController,
} from "./research-plan.controller.js";

const router = Router({
  mergeParams: true,
});

// Generate and save a research plan.
router.post(
  "/generate",
  generateResearchPlanController
);

// List plans belonging to a project.
router.get(
  "/",
  getResearchPlansController
);

// Get a particular plan.
router.get(
  "/:planId",
  getResearchPlanController
);

// Update an individual task's status.
router.patch(
  "/:planId/tasks/:areaIndex/:taskIndex",
  updateResearchTaskStatusController
);

export default router;

