import mongoose, { Document, Schema, Types } from "mongoose";

export interface IResearchSource extends Document {
  projectId: Types.ObjectId;
  planId: Types.ObjectId;
  executionId: Types.ObjectId;
  areaIndex: number;
  taskIndex: number;
  url: string;
  title: string;
  domain: string;
  description?: string;
  content?: string;
  publishedAt?: Date;
  fetchedAt: Date;
  contentHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResearchSourceSchema = new Schema<IResearchSource>(
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
    url: { type: String, required: true },
    title: { type: String, required: true },
    domain: { type: String, required: true, index: true },
    description: String,
    content: String,
    publishedAt: Date,
    fetchedAt: { type: Date, default: Date.now },
    contentHash: String,
  },
  { timestamps: true },
);

ResearchSourceSchema.index({
  executionId: 1,
  areaIndex: 1,
  taskIndex: 1,
});

ResearchSourceSchema.index({ executionId: 1, url: 1 }, { unique: true });

export const ResearchSourceModel =
  mongoose.models.ResearchSource ||
  mongoose.model<IResearchSource>("ResearchSource", ResearchSourceSchema);
