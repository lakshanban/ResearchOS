import mongoose, { Document, Schema, Types } from "mongoose";

export interface IResearchFinding extends Document {
  projectId: Types.ObjectId;
  planId: Types.ObjectId;
  executionId: Types.ObjectId;
  areaIndex: number;
  taskIndex: number;
  claim: string;
  explanation: string;
  confidence: number;
  sourceIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ResearchFindingSchema = new Schema<IResearchFinding>(
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
    executionId: {
      type: Schema.Types.ObjectId,
      ref: "ResearchExecution",
      required: true,
      index: true,
    },
    areaIndex: { type: Number, required: true },
    taskIndex: { type: Number, required: true },
    claim: { type: String, required: true, trim: true },
    explanation: { type: String, required: true, trim: true },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    sourceIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "ResearchSource",
        required: true,
      },
    ],
  },
  { timestamps: true },
);

ResearchFindingSchema.index({
  executionId: 1,
  areaIndex: 1,
  taskIndex: 1,
});

export const ResearchFindingModel =
  mongoose.models.ResearchFinding ||
  mongoose.model<IResearchFinding>("ResearchFinding", ResearchFindingSchema);
