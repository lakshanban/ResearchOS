import { api } from "./client";
import { normalizeList, unwrap } from "./normalizers";
import type { Project } from "../types";

export const projectsApi = {
  async list() {
    return normalizeList<Project>((await api.get("/projects")).data);
  },
  async get(projectId: string) {
    return unwrap<Project>((await api.get(`/projects/${projectId}`)).data);
  },
  async create(input: { title: string; objective: string }) {
    return unwrap<Project>((await api.post("/projects", input)).data);
  },
};
