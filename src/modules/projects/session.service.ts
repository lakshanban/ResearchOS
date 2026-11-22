import mongoose from "mongoose";

import { ResearchProject } from "./models/research-project.model";
import { ResearchSession } from "./models/research-session.model";
import { LOCAL_OWNER_ID } from "./project.service";

interface CreateSessionInput {
  query: string;
}

async function validateProjectOwnership(projectId: string) {
  if (!mongoose.isValidObjectId(projectId)) {
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

export async function createResearchSession(
  projectId: string,
  input: CreateSessionInput,
) {
  const project = await validateProjectOwnership(projectId);

  return ResearchSession.create({
    projectId: project._id,
    query: input.query,
  });
}

export async function getResearchSessions(projectId: string) {
  const project = await validateProjectOwnership(projectId);

  return ResearchSession.find({
    projectId: project._id,
  }).sort({ createdAt: -1 });
}
