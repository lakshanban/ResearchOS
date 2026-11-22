import { api } from "./client";
import { normalizeList, unwrap } from "./normalizers";
import type { AskResponse, ResearchDocument, ResearchPlanRecord, ResearchSession, ResearchExecution, ResearchExecutionDetail } from "../types";

export const workspaceApi = {
  async documents(projectId: string) {
    return normalizeList<ResearchDocument>(
      (await api.get(`/projects/${projectId}/documents`)).data,
    );
  },
  async upload(projectId: string, file: File) {
    const body = new FormData();
    body.append("document", file);
    return (await api.post(`/projects/${projectId}/documents`, body, {
      headers: { "Content-Type": "multipart/form-data" },
    })).data;
  },
  async ask(projectId: string, query: string) {
    return unwrap<AskResponse>(
      (await api.post(`/projects/${projectId}/documents/ask`, { query })).data,
    );
  },
  async sessions(projectId: string) {
    return normalizeList<ResearchSession>(
      (await api.get(`/projects/${projectId}/sessions`)).data,
    );
  },
  async plans(projectId: string) {
    return normalizeList<ResearchPlanRecord>(
      (await api.get(`/projects/${projectId}/research-plans`)).data,
    );
  },
  async generatePlan(projectId: string, objective: string) {
    return unwrap<ResearchPlanRecord>(
      (await api.post(`/projects/${projectId}/research-plans/generate`, { objective }, {
        timeout: 300_000,
      })).data,
    );
  },
  async executions(projectId: string) {
    return normalizeList<ResearchExecution>(
      (await api.get(`/projects/${projectId}/research-executions`)).data,
    );
  },
  async startExecution(projectId: string, planId: string) {
    return unwrap<ResearchExecution>(
      (await api.post(`/projects/${projectId}/research-executions`, { planId }, { timeout: 600_000 })).data,
    );
  },
  async executionDetail(projectId: string, executionId: string) {
    return unwrap<ResearchExecutionDetail>(
      (await api.get(`/projects/${projectId}/research-executions/${executionId}`)).data,
    );
  },
  async updateTask(
    projectId: string,
    planId: string,
    areaIndex: number,
    taskIndex: number,
    status: "pending" | "in_progress" | "completed",
  ) {
    return unwrap<ResearchPlanRecord>(
      (await api.patch(
        `/projects/${projectId}/research-plans/${planId}/tasks/${areaIndex}/${taskIndex}`,
        { status },
      )).data,
    );
  },
};
