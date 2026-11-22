export interface Project {
  _id: string;
  title: string;
  objective?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResearchTask {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  expectedOutcome: string;
  status: "pending" | "in_progress" | "completed";
}

export interface ResearchArea {
  name: string;
  description: string;
  tasks: ResearchTask[];
}

export interface PlanData {
  title: string;
  description: string;
  researchAreas: ResearchArea[];
}

export interface ResearchPlanRecord {
  _id: string;
  projectId: string;
  objective: string;
  plan: PlanData;
  status: "draft" | "active" | "completed";
  retryCount: number;
  isValid: boolean;
  validationErrors: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ResearchDocument {
  _id: string;
  filename: string;
  mimeType?: string;
  size?: number;
  status: "processing" | "completed" | "failed";
  pageCount?: number;
  chunkCount?: number;
  createdAt?: string;
  error?: string;
}

export interface ResearchSession {
  _id: string;
  title?: string;
  objective?: string;
  status?: string;
  createdAt?: string;
}

export interface SourceReference {
  reference: number;
  filename: string;
  page: number | null;
  chunkIndex?: number;
}

export interface AskResponse {
  answer: string;
  sources: SourceReference[];
}


export type ExecutionStatus = "pending" | "running" | "completed" | "partially_completed" | "failed" | "cancelled";
export type ExecutionTaskStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface ResearchExecutionTask {
  areaIndex: number;
  taskIndex: number;
  areaName: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  expectedOutcome: string;
  status: ExecutionTaskStatus;
  attempts?: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ResearchExecution {
  _id: string;
  projectId: string;
  planId: string;
  status: ExecutionStatus;
  tasks: ResearchExecutionTask[];
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  startedAt?: string;
  completedAt?: string;
  lastError?: string;
  createdAt?: string;
}

export interface ResearchExecutionSource {
  _id: string;
  url: string;
  title: string;
  domain: string;
  description?: string;
  content?: string;
  fetchedAt?: string;
  areaIndex: number;
  taskIndex: number;
}

export interface ResearchExecutionFinding {
  _id: string;
  claim: string;
  explanation: string;
  confidence: number;
  sourceIds: Array<string | ResearchExecutionSource>;
  areaIndex: number;
  taskIndex: number;
}

export interface ResearchExecutionDetail {
  execution: ResearchExecution;
  sources: ResearchExecutionSource[];
  findings: ResearchExecutionFinding[];
}
