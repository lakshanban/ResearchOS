import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Dashboard } from "./pages/Dashboard";
import { Projects } from "./pages/Projects";
import { ProjectWorkspace } from "./pages/ProjectWorkspace";

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  return <div className="app-shell"><Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} /><div className="main-shell"><Topbar /><main className="main-content"><Routes><Route path="/" element={<Dashboard />} /><Route path="/projects" element={<Projects />} /><Route path="/projects/:projectId" element={<ProjectWorkspace />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></main><footer className="app-footer"><span>ResearchOS</span><span>Powered by local AI · Your research stays in your workspace</span></footer></div></div>;
}
