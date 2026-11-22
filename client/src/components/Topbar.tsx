import { Bell, Search } from "lucide-react";

export function Topbar() {
  return (
    <header className="topbar">
      <div className="crumb">Workspace <span>/</span> <strong>ResearchOS</strong></div>
      <div className="top-actions">
        <div className="search-pill"><Search size={15} /><span>Search your workspace</span><kbd>⌘ K</kbd></div>
        <button className="icon-btn" aria-label="Notifications"><Bell size={18} /></button>
        <div className="avatar small">R</div>
      </div>
    </header>
  );
}
