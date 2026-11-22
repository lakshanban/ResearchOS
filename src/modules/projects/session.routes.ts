import { Router } from "express";

import {
  createSessionController,
  getSessionsController,
} from "./session.controller.js";

const router = Router({ mergeParams: true });

router.post("/", createSessionController);

router.get("/", getSessionsController);

export default router;
