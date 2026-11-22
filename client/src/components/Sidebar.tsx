import { BrainCircuit, FolderKanban, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Plus, Settings2 } from "lucide-react";
import { NavLink } from "react-router-dom";

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="brand">
        <div className="brand-mark"><BrainCircuit size={21} /></div>
        {!collapsed && <div><strong>ResearchOS</strong><span>AI research workspace</span></div>}
      </div>
      <div className="nav-label">{!collapsed && "WORKSPACE"}</div>
      <nav className="nav">
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} title="Dashboard">
          <LayoutDashboard size={18} /> {!collapsed && <span>Dashboard</span>}
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} title="Projects">
          <FolderKanban size={18} /> {!collapsed && <span>Projects</span>}
        </NavLink>
      </nav>
      <div className="sidebar-bottom">
        <div className="local-status"><span className="status-dot" />{!collapsed && <span>Local AI connected</span>}</div>
        <button className="nav-link nav-button" onClick={onToggle} title="Toggle sidebar">
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          {!collapsed && <span>Collapse sidebar</span>}
        </button>
        <div className="user-chip"><div className="avatar">R</div>{!collapsed && <div><strong>Researcher</strong><span>Local workspace</span></div>}<Settings2 size={16} className="user-settings" /></div>
      </div>
    </aside>
  );
}
