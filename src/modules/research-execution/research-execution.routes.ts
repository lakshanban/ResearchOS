import { Router } from "express";

import {
  startExecutionController,
  getExecutionsController,
  getExecutionByIdController,
} from "./controllers/research-execution.controller";

const router = Router();

router.post("/:projectId/research-executions", startExecutionController);

router.get("/:projectId/research-executions", getExecutionsController);

router.get(
  "/:projectId/research-executions/:executionId",
  getExecutionByIdController,
);

export default router;
