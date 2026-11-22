import { Router } from "express";
import { researchController } from "./research.controller";

const router = Router();

router.post("/", researchController);

export default router;
