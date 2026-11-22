import mongoose, { Schema, Document, Types } from "mongoose";

export interface IResearchDocument extends Document {
  projectId: Types.ObjectId;
  filename: string;
  mimeType: string;
  size: number;
  storagePath: string;
  status: "processing" | "completed" | "failed";
  pageCount: number;
  chunkCount: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResearchDocumentSchema = new Schema<IResearchDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "ResearchProject",
      required: true,
      index: true,
    },

    filename: {
      type: String,
      required: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
    },

    storagePath: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },

    pageCount: {
      type: Number,
      default: 0,
    },

    chunkCount: {
      type: Number,
      default: 0,
    },

    error: String,
  },
  {
    timestamps: true,
  },
);

ResearchDocumentSchema.index({
  projectId: 1,
  createdAt: -1,
});

export const ResearchDocument = mongoose.model<IResearchDocument>(
  "ResearchDocument",
  ResearchDocumentSchema,
);
