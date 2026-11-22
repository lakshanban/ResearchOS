import mongoose from "mongoose";
import {
  ResearchProject,
  ResearchProjectStatus,
} from "./models/research-project.model";
import { ResearchSession } from "./models/research-session.model";

export const LOCAL_OWNER_ID = "local-user";

interface CreateProjectInput {
  title: string;
  description?: string;
  objective: string;
  tags?: string[];
}

interface UpdateProjectInput {
  title?: string;
  description?: string;
  objective?: string;
  status?: ResearchProjectStatus;
  tags?: string[];
}

interface CreateSessionInput {
  projectId: string;
  query: string;
}

export async function createProject(input: CreateProjectInput) {
  return ResearchProject.create({
    ...input,
    ownerId: LOCAL_OWNER_ID,
  });
}

export async function getProjects() {
  return ResearchProject.find({ ownerId: LOCAL_OWNER_ID }).sort({
    createdAt: -1,
  });
}

export async function getProjectById(projectId: string) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid project ID");
  }

  const project = await ResearchProject.findOne({
    _id: projectId,
    ownerId: LOCAL_OWNER_ID,
  });

  if (!project) {
    throw new Error("Project not found");
  }

  return project;
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid project ID");
  }

  const project = await ResearchProject.findOneAndUpdate(
    { _id: projectId, ownerId: LOCAL_OWNER_ID },
    { $set: input },
    { new: true, runValidators: true },
  );

  if (!project) {
    throw new Error("Project not found");
  }

  return project;
}

export async function deleteProject(projectId: string) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid project ID");
  }

  const project = await ResearchProject.findOneAndDelete({
    _id: projectId,
    ownerId: LOCAL_OWNER_ID,
  });
  if (!project) {
    throw new Error("Project not found");
  }

  await ResearchSession.deleteMany({ projectId: projectId });

  return {
    message: "Project and associated research sessions deleted",
  };
}
