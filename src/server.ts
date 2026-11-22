import "dotenv/config";

import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";

import { connectDatabase } from "./config/database.js";
import { testLLM } from "./config/llm.js";

import researchRoutes from "./modules/research/research.routes.js";
import projectRoutes from "./modules/projects/project.routes.js";
import researchExecutionRoutes from "./modules/research-execution/research-execution.routes";

import { ZodError } from "zod";

import { initializeVectorStore } from "./config/vector-store.js";

const app = express();

app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    application: "ResearchOS",
  });
});

app.get("/health/llm", async (_req, res) => {
  try {
    const response = await testLLM();

    res.json({
      status: "CONNECTED",
      model: process.env.OLLAMA_MODEL,
      response,
    });
  } catch {
    res.status(503).json({
      status: "DISCONNECTED",
      message: "Unable to connect to Ollama",
    });
  }
});

app.use("/api/research", researchRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects", researchExecutionRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues,
    });
    return;
  }

  if (error.message === "Project not found") {
    res.status(404).json({
      success: false,
      message: error.message,
    });
    return;
  }

  if (error.message === "Invalid project ID") {
    res.status(400).json({
      success: false,
      message: error.message,
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

async function bootstrap() {
  try {
    await connectDatabase();

    await initializeVectorStore();

    const port = Number(process.env.PORT || 4000);

    app.listen(port, () => {
      console.log(`ResearchOS running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start ResearchOS:", error);
    process.exit(1);
  }
}

bootstrap();
