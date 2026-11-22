import { useQuery } from "@tanstack/react-query";
import { Plus, Search, FolderKanban } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { projectsApi } from "../api/projects";
import type { Project } from "../types";
import { StatusPill } from "../components/StatusPill";

export function Projects() {
  const [search, setSearch] = useState("");
  const { data = [], isLoading, error } = useQuery({ queryKey: ["projects"], queryFn: projectsApi.list });
  const projects = useMemo(() => data.filter((p: Project) => `${p.title} ${p.objective || ""}`.toLowerCase().includes(search.toLowerCase())), [data, search]);
  return <div className="page"><div className="page-title-row"><div><div className="eyebrow">WORKSPACE</div><h1>Research projects</h1><p className="muted">Organize your questions, source material and discoveries.</p></div></div>
    <div className="toolbar"><div className="search-input"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects…" /></div><span className="result-count">{projects.length} projects</span></div>
    {isLoading ? <div className="empty-state">Loading projects…</div> : error ? <div className="error-box">{(error as Error).message}</div> : projects.length ? <div className="project-grid">{projects.map((project: Project, i) => <Link to={`/projects/${project._id}`} className="project-card" key={project._id}><div className="project-card-top"><div className="project-symbol violet"><FolderKanban size={19} /></div><StatusPill status={project.status} /></div><h3>{project.title}</h3><p>{project.objective || project.description || "No objective provided."}</p><div className="project-card-foot"><span>{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "Project"}</span><span>Open workspace ↗</span></div></Link>)}</div> : <div className="empty-state"><div className="empty-icon"><FolderKanban /></div><h3>No projects found</h3><p>Try another search or create a project from the dashboard.</p></div>}
  </div>;
}
