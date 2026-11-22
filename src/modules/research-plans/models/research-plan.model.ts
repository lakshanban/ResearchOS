import mongoose, { Document, Schema, Types } from "mongoose";

import type { ResearchPlan as ResearchPlanData } from "../../../agents/research-planner/research-planner.schema.js";

export interface IResearchPlan extends Document {
  projectId: Types.ObjectId;
  objective: string;
  plan: ResearchPlanData;
  status: "draft" | "active" | "completed";
  retryCount: number;
  isValid: boolean;
  validationErrors: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ResearchPlanSchema = new Schema<IResearchPlan>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "ResearchProject",
      required: true,
      index: true,
    },

    objective: {
      type: String,
      required: true,
      trim: true,
    },

    // The plan structure is validated using Zod
    // before it is persisted.
    plan: {
      type: Schema.Types.Mixed,
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "active", "completed"],
      default: "active",
    },

    retryCount: {
      type: Number,
      default: 0,
    },

    isValid: {
      type: Boolean,
      default: false,
    },

    validationErrors: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

ResearchPlanSchema.index({
  projectId: 1,
  createdAt: -1,
});

export const ResearchPlanModel =
  mongoose.models.ResearchPlan ||
  mongoose.model<IResearchPlan>("ResearchPlan", ResearchPlanSchema);
  
