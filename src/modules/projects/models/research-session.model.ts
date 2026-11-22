import mongoose, { Schema, Document, Types } from "mongoose";

export type ResearchSessionStatus = "pending" | "running" | "completed" | "failed";

export interface IResearchSession extends Document {
    projectId: Types.ObjectId;
    query: string;
    findings?: string;
    status: ResearchSessionStatus;
    startedAt: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ResearchSessionSchema = new Schema<IResearchSession>({
    projectId: { type: Schema.Types.ObjectId, ref: "ResearchProject", required: true },
    query: { type: String, required: true },
    findings: { type: String },
    status: { type: String, enum: ["pending", "running", "completed", "failed"], default: "pending" },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

ResearchSessionSchema.index({
    projectId: 1,
    createdAt: -1,
});

export const ResearchSession = mongoose.model<IResearchSession>("ResearchSession", ResearchSessionSchema);
