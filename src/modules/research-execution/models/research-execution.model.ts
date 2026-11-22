import mongoose, { Document, Schema, Types } from "mongoose";

import type {
  ExecutionTask,
  ResearchExecutionStatus,
} from "../schemas/research-execution.schema.js";

export interface IResearchExecution extends Document {
  projectId: Types.ObjectId;
  planId: Types.ObjectId;
  status: ResearchExecutionStatus;
  tasks: ExecutionTask[];
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  startedAt?: Date;
  completedAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExecutionTaskSchema = new Schema(
  {
    areaIndex: { type: Number, required: true },
    taskIndex: { type: Number, required: true },
    areaName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },
    expectedOutcome: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed", "skipped"],
      default: "pending",
    },
    attempts: { type: Number, default: 0 },
    error: String,
    startedAt: Date,
    completedAt: Date,
  },
  { _id: false },
);

const ResearchExecutionSchema = new Schema<IResearchExecution>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "ResearchProject",
      required: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "ResearchPlan",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "running",
        "completed",
        "partially_completed",
        "failed",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },
    tasks: {
      type: [ExecutionTaskSchema],
      default: [],
    },
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    failedTasks: { type: Number, default: 0 },
    startedAt: Date,
    completedAt: Date,
    lastError: String,
  },
  { timestamps: true },
);

ResearchExecutionSchema.index({
  projectId: 1,
  createdAt: -1,
});

ResearchExecutionSchema.index({
  planId: 1,
  createdAt: -1,
});

export const ResearchExecutionModel =
  mongoose.models.ResearchExecution ||
  mongoose.model<IResearchExecution>(
    "ResearchExecution",
    ResearchExecutionSchema,
  );
