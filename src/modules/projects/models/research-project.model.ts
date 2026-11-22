import mongoose, { Schema, Document } from "mongoose";

export type ResearchProjectStatus = "draft" | "active" | "completed" | "archived";

export interface IResearchProject extends Document {
    title: string;
    description?: string;
    objective: string;
    status: ResearchProjectStatus;
    ownerId: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

const ResearchProjectSchema = new Schema<IResearchProject>({
    title: { type: String, required: true },
    description: { type: String },
    objective: { type: String, required: true },
    status: { type: String, enum: ["draft", "active", "completed", "archived"], default: "draft" },
    ownerId: { type: String, required: true },
    tags: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

ResearchProjectSchema.index({
    ownerId: 1,
    createdAt: -1,
});

export const ResearchProject = mongoose.model<IResearchProject>("ResearchProject", ResearchProjectSchema);
