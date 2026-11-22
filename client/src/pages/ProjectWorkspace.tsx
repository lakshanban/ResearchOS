import type { ReactNode, FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Bot, CheckCircle2, ChevronDown, Circle, Clock3, FileText, FolderOpen, MessageSquare, Plus, RefreshCw, Send, Sparkles, UploadCloud, Play, ExternalLink, ShieldCheck, AlertTriangle, ArrowUpRight } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { projectsApi } from "../api/projects";
import { workspaceApi } from "../api/workspace";
import { StatusPill } from "../components/StatusPill";
import type { ResearchArea, ResearchDocument, ResearchPlanRecord, ResearchSession } from "../types";

type Tab = "overview" | "documents" | "plans" | "executions" | "assistant" | "sessions";

export function ProjectWorkspace() {
  const { projectId = "" } = useParams();
  const [tab, setTab] = useState<Tab>("overview");
  const { data: project, isLoading, error } = useQuery({ queryKey: ["project", projectId], queryFn: () => projectsApi.get(projectId), enabled: !!projectId });
  const tabs = [
    { id: "overview", label: "Overview", icon: FolderOpen },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "plans", label: "Research plans", icon: BookOpen },
    { id: "executions", label: "Executions", icon: Play },
    { id: "assistant", label: "AI assistant", icon: MessageSquare },
    { id: "sessions", label: "Sessions", icon: Clock3 },
  ] as const;
  if (isLoading) return <div className="page"><div className="empty-state">Loading project…</div></div>;
  if (error || !project) return <div className="page"><div className="error-box">{(error as Error)?.message || "Project not found"}</div><Link to="/projects" className="text-link">Back to projects</Link></div>;
  return <div className="page workspace-page">
    <Link to="/projects" className="back-link"><ArrowLeft size={15} /> All projects</Link>
    <div className="workspace-heading"><div><div className="eyebrow">RESEARCH PROJECT</div><h1>{project.title}</h1><p className="muted">{project.objective || project.description || "No objective has been added."}</p></div><StatusPill status={project.status || "active"} /></div>
    <div className="tabs">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={`tab ${tab === id ? "selected" : ""}`} onClick={() => setTab(id)}><Icon size={16} />{label}</button>)}</div>
    {tab === "overview" && <Overview projectId={projectId} onTab={setTab} />}
    {tab === "documents" && <Documents projectId={projectId} />}
    {tab === "plans" && <Plans projectId={projectId} objective={project.objective || project.description || project.title} />}
    {tab === "executions" && <Executions projectId={projectId} />}
    {tab === "assistant" && <Assistant projectId={projectId} />}
    {tab === "sessions" && <Sessions projectId={projectId} />}
  </div>;
}

function Overview({ projectId, onTab }: { projectId: string; onTab: (tab: Tab) => void }) {
  const docs = useQuery({ queryKey: ["documents", projectId], queryFn: () => workspaceApi.documents(projectId) });
  const plans = useQuery({ queryKey: ["plans", projectId], queryFn: () => workspaceApi.plans(projectId) });
  const sessions = useQuery({ queryKey: ["sessions", projectId], queryFn: () => workspaceApi.sessions(projectId) });
  return <div className="overview-grid"><div className="overview-main"><div className="section-heading"><div><h2>Project workspace</h2><p className="muted">Your research materials and AI-generated work in one place.</p></div></div><div className="quick-actions"><button onClick={() => onTab("documents")} className="quick-card"><div className="quick-icon blue"><UploadCloud /></div><strong>Add source documents</strong><span>Upload PDF, DOCX or TXT files</span><b>Open documents ↗</b></button><button onClick={() => onTab("plans")} className="quick-card"><div className="quick-icon violet"><Sparkles /></div><strong>Generate research plan</strong><span>Break your objective into actionable tasks</span><b>Open planner ↗</b></button><button onClick={() => onTab("assistant")} className="quick-card"><div className="quick-icon mint"><Bot /></div><strong>Ask your documents</strong><span>Get answers grounded in your sources</span><b>Open assistant ↗</b></button></div><div className="section-heading"><div><h2>Research workflow</h2><p className="muted">A suggested path through your project</p></div></div><div className="workflow-list"><WorkflowItem n="01" title="Collect source material" desc="Upload reports, papers and reference documents." done={(docs.data?.length || 0) > 0} /><WorkflowItem n="02" title="Generate a research plan" desc="Use the planner agent to structure the objective." done={(plans.data?.length || 0) > 0} /><WorkflowItem n="03" title="Explore with AI" desc="Ask questions and inspect source references." done={false} /></div></div><aside className="overview-side"><div className="side-panel"><h3>Project activity</h3><Metric icon={<FileText />} label="Documents" value={docs.data?.length ?? "—"} /><Metric icon={<BookOpen />} label="Research plans" value={plans.data?.length ?? "—"} /><Metric icon={<Clock3 />} label="Sessions" value={sessions.data?.length ?? "—"} /></div><div className="tip-card"><Sparkles size={18} /><strong>Research tip</strong><p>Start with a focused objective. Your planner agent will break it into research areas and manageable tasks.</p></div></aside></div>;
}
function WorkflowItem({ n, title, desc, done }: { n: string; title: string; desc: string; done: boolean }) { return <div className="workflow-item"><div className={`workflow-number ${done ? "done" : ""}`}>{done ? <CheckCircle2 size={17} /> : n}</div><div><strong>{title}</strong><p>{desc}</p></div><span className={done ? "complete-label" : "pending-label"}>{done ? "Completed" : "Suggested"}</span></div>; }
function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: React.ReactNode }) { return <div className="metric-row"><div className="metric-icon">{icon}</div><span>{label}</span><strong>{value}</strong></div>; }

function Documents({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data = [], isLoading, error } = useQuery({ queryKey: ["documents", projectId], queryFn: () => workspaceApi.documents(projectId) });
  const upload = useMutation({ mutationFn: (file: File) => workspaceApi.upload(projectId, file), onSuccess: () => qc.invalidateQueries({ queryKey: ["documents", projectId] }) });
  const [uploadError, setUploadError] = useState("");
  function choose(file?: File) { if (!file) return; setUploadError(""); if (!/\.(pdf|docx|txt)$/i.test(file.name)) { setUploadError("Please select a PDF, DOCX or TXT file."); return; } upload.mutate(file, { onError: e => setUploadError((e as Error).message) }); }
  return <div className="content-section"><div className="section-heading"><div><h2>Source documents</h2><p className="muted">Upload documents to make them searchable with RAG.</p></div><button className="btn primary" onClick={() => inputRef.current?.click()} disabled={upload.isPending}><Plus size={16} /> Upload document</button><input ref={inputRef} hidden type="file" accept=".pdf,.docx,.txt" onChange={e => choose(e.target.files?.[0])} /></div>
    <div className="upload-zone" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); choose(e.dataTransfer.files?.[0]); }}><div className="upload-icon"><UploadCloud size={24} /></div><strong>{upload.isPending ? "Uploading and processing…" : "Drop a document here"}</strong><span>PDF, DOCX or TXT · Maximum size depends on backend configuration</span><button className="text-link" onClick={() => inputRef.current?.click()}>Browse files</button></div>
    {uploadError && <div className="error-box">{uploadError}</div>}{upload.isError && <div className="error-box">{(upload.error as Error).message}</div>}
    <div className="list-card"><div className="list-card-head"><strong>Uploaded documents</strong><span>{data.length} files</span></div>{isLoading ? <div className="list-empty">Loading documents…</div> : error ? <div className="list-empty error-text">{(error as Error).message}</div> : data.length ? data.map((doc: ResearchDocument) => <div className="document-row" key={doc._id}><div className="file-type">{doc.filename.toLowerCase().endsWith(".pdf") ? "PDF" : doc.filename.toLowerCase().endsWith(".docx") ? "DOCX" : "TXT"}</div><div className="file-info"><strong>{doc.filename}</strong><span>{doc.chunkCount ?? 0} chunks · {doc.pageCount ?? "—"} pages</span>{doc.error && <small className="error-text">{doc.error}</small>}</div><StatusPill status={doc.status} /></div>) : <div className="list-empty">No documents uploaded yet.</div>}</div>
  </div>;
}

function Plans({ projectId, objective }: { projectId: string; objective: string }) {
  const qc = useQueryClient();
  const { data = [], isLoading, error } = useQuery({ queryKey: ["plans", projectId], queryFn: () => workspaceApi.plans(projectId) });
  const [prompt, setPrompt] = useState(objective);
  const [selected, setSelected] = useState<string | null>(null);
  const generate = useMutation({ mutationFn: () => workspaceApi.generatePlan(projectId, prompt), onSuccess: (plan) => { qc.invalidateQueries({ queryKey: ["plans", projectId] }); setSelected(plan._id); } });
  const update = useMutation({ mutationFn: ({ planId, ai, ti, status }: { planId: string; ai: number; ti: number; status: "pending" | "in_progress" | "completed" }) => workspaceApi.updateTask(projectId, planId, ai, ti, status), onSuccess: () => qc.invalidateQueries({ queryKey: ["plans", projectId] }) });
  const activePlan = useMemo(() => data.find(p => p._id === selected) || data[0], [data, selected]);
  return <div className="content-section"><div className="section-heading"><div><h2>Research planner</h2><p className="muted">Generate, save and manage structured research plans with your local Qwen model.</p></div></div>
    <div className="planner-compose"><div className="planner-badge"><Sparkles size={15} /> LANGGRAPH PLANNER AGENT</div><label>Research objective<textarea rows={3} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe what you want to investigate…" /></label><div className="planner-compose-foot"><span>Your plan will be saved to this project.</span><button className="btn primary" disabled={generate.isPending || prompt.trim().length < 10} onClick={() => generate.mutate()}>{generate.isPending ? <><RefreshCw size={15} className="spin" /> Generating…</> : <><Sparkles size={15} /> Generate research plan</>}</button></div>{generate.isError && <div className="error-box">{(generate.error as Error).message}</div>}{generate.isSuccess && <div className="success-note"><CheckCircle2 size={15} /> Research plan generated and saved.</div>}</div>
    <div className="plans-layout"><div className="list-card plans-list"><div className="list-card-head"><strong>Saved plans</strong><span>{data.length}</span></div>{isLoading ? <div className="list-empty">Loading plans…</div> : error ? <div className="list-empty error-text">{(error as Error).message}</div> : data.length ? data.map(plan => <button key={plan._id} className={`plan-list-item ${activePlan?._id === plan._id ? "chosen" : ""}`} onClick={() => setSelected(plan._id)}><div className="plan-list-icon"><BookOpen size={17} /></div><div><strong>{plan.plan?.title || "Untitled research plan"}</strong><span>{plan.plan?.researchAreas?.length || 0} areas · {taskCount(plan)} tasks</span></div><ChevronDown size={15} /></button>) : <div className="list-empty">No saved plans yet. Generate your first plan above.</div>}</div>
      <div className="plan-detail">{activePlan ? <PlanDetail plan={activePlan} onStatus={(ai, ti, status) => update.mutate({ planId: activePlan._id, ai, ti, status })} updating={update.isPending} /> : <div className="empty-state compact"><BookOpen size={27} /><h3>Your plan will appear here</h3><p>Generate a research plan to see its areas and tasks.</p></div>}</div></div>
  </div>;
}
function taskCount(plan: ResearchPlanRecord) { return plan.plan?.researchAreas?.reduce((n, a) => n + (a.tasks?.length || 0), 0) || 0; }
function PlanDetail({ plan, onStatus, updating }: { plan: ResearchPlanRecord; onStatus: (ai: number, ti: number, status: "pending" | "in_progress" | "completed") => void; updating: boolean }) {
  const [expanded, setExpanded] = useState<number[]>([0]);
  function toggle(i: number) { setExpanded(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]); }
  const done = taskCount(plan) ? plan.plan.researchAreas.reduce((n, a) => n + a.tasks.filter(t => t.status === "completed").length, 0) : 0;
  const total = taskCount(plan);
  return <><div className="plan-detail-head"><div><div className="eyebrow">SAVED RESEARCH PLAN</div><h2>{plan.plan?.title}</h2><p>{plan.plan?.description}</p></div><StatusPill status={plan.status} /></div><div className="plan-progress"><div><strong>{done} of {total} tasks completed</strong><span>{total ? Math.round(done / total * 100) : 0}%</span></div><div className="progress-track"><div style={{ width: `${total ? done / total * 100 : 0}%` }} /></div></div>
    {plan.validationErrors?.length > 0 && <div className="warning-box">Plan validation notes: {plan.validationErrors.join("; ")}</div>}
    <div className="area-list">{plan.plan?.researchAreas?.map((area: ResearchArea, ai: number) => <section className="area-card" key={`${area.name}-${ai}`}><button className="area-head" onClick={() => toggle(ai)}><div className="area-index">{String(ai + 1).padStart(2, "0")}</div><div className="area-title"><strong>{area.name}</strong><span>{area.description}</span></div><span className="area-task-count">{area.tasks.length} tasks</span><ChevronDown size={16} className={expanded.includes(ai) ? "rotate" : ""} /></button>{expanded.includes(ai) && <div className="task-list">{area.tasks.map((task, ti) => <div className="task-row" key={`${task.title}-${ti}`}><button className={`task-check ${task.status}`} disabled={updating} onClick={() => onStatus(ai, ti, task.status === "completed" ? "pending" : "completed")} aria-label="Toggle completed">{task.status === "completed" ? <CheckCircle2 size={18} /> : <Circle size={18} />}</button><div className="task-body"><strong className={task.status === "completed" ? "task-done" : ""}>{task.title}</strong><p>{task.description}</p><small>Outcome: {task.expectedOutcome}</small></div><div className="task-controls"><span className={`priority ${task.priority}`}>{task.priority}</span><select value={task.status} disabled={updating} onChange={e => onStatus(ai, ti, e.target.value as "pending" | "in_progress" | "completed")} aria-label="Task status"><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></div></div>)}</div>}</section>)}</div>
  </>;
}

function Executions({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedExecutionId, setSelectedExecutionId] = useState("");
  const plansQuery = useQuery({ queryKey: ["plans", projectId], queryFn: () => workspaceApi.plans(projectId) });
  const executionsQuery = useQuery({ queryKey: ["executions", projectId], queryFn: () => workspaceApi.executions(projectId), refetchInterval: 5000 });
  const start = useMutation({
    mutationFn: () => workspaceApi.startExecution(projectId, selectedPlanId),
    onSuccess: async (execution) => {
      setSelectedExecutionId(execution._id);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["executions", projectId] }),
        qc.invalidateQueries({ queryKey: ["plans", projectId] }),
      ]);
    },
  });
  const executions = executionsQuery.data || [];
  const selectedExecution = executions.find((item) => item._id === selectedExecutionId) || executions[0];
  const detailQuery = useQuery({
    queryKey: ["execution-detail", projectId, selectedExecution?._id],
    queryFn: () => workspaceApi.executionDetail(projectId, selectedExecution!._id),
    enabled: !!selectedExecution?._id,
    refetchInterval: selectedExecution?.status === "running" ? 3000 : false,
  });
  const plans = plansQuery.data || [];
  const runnablePlans = plans.filter((plan) => plan.plan?.researchAreas?.some((area) => area.tasks?.some((task) => task.status !== "completed")));
  const detail = detailQuery.data;
  const progress = selectedExecution?.totalTasks ? Math.round((selectedExecution.completedTasks / selectedExecution.totalTasks) * 100) : 0;

  return <div className="content-section execution-page">
    <div className="section-heading"><div><h2>Research executions</h2><p className="muted">Run your research plans and inspect the sources and evidence collected by ResearchOS.</p></div><button className="btn ghost" onClick={() => { qc.invalidateQueries({ queryKey: ["executions", projectId] }); qc.invalidateQueries({ queryKey: ["plans", projectId] }); }}><RefreshCw size={14} /> Refresh</button></div>
    <div className="execution-launcher">
      <div className="execution-launch-copy"><div className="planner-badge"><Play size={14} /> LANGGRAPH EXECUTION AGENT</div><h3>Execute a research plan</h3><p>Select a saved plan. ResearchOS will search the web, extract page content, analyze claims and save the results to MongoDB.</p></div>
      <div className="execution-launch-controls"><label>Research plan<select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}><option value="">Choose a research plan…</option>{runnablePlans.map((plan) => <option key={plan._id} value={plan._id}>{plan.plan?.title || plan.objective}</option>)}</select></label><button className="btn primary" disabled={!selectedPlanId || start.isPending} onClick={() => start.mutate()}>{start.isPending ? <><RefreshCw size={15} className="spin" /> Executing…</> : <><Play size={15} /> Start research</>}</button></div>
      {start.isPending && <div className="execution-running-note"><span className="status-dot" /> The API runs the workflow synchronously. Keep this page open while the worker searches and analyzes sources.</div>}
      {start.isError && <div className="error-box execution-message">{(start.error as Error).message}</div>}
      {start.isSuccess && <div className="success-note execution-message"><CheckCircle2 size={15} /> Execution finished and saved.</div>}
      {!plansQuery.isLoading && plans.length === 0 && <div className="execution-message muted">Generate a research plan in the Research plans tab before starting an execution.</div>}
    </div>
    <div className="execution-layout">
      <section className="list-card execution-list"><div className="list-card-head"><strong>Execution history</strong><span>{executions.length}</span></div>
        {executionsQuery.isLoading ? <div className="list-empty">Loading executions…</div> : executionsQuery.isError ? <div className="list-empty error-text">{(executionsQuery.error as Error).message}</div> : executions.length ? executions.map((execution) => <button key={execution._id} className={`execution-list-item ${selectedExecution?._id === execution._id ? "chosen" : ""}`} onClick={() => setSelectedExecutionId(execution._id)}><div className="execution-list-icon"><Play size={15} /></div><div className="execution-list-copy"><strong>{plans.find((p) => p._id === execution.planId)?.plan?.title || "Research execution"}</strong><span>{execution.completedTasks}/{execution.totalTasks} tasks · {execution.createdAt ? new Date(execution.createdAt).toLocaleString() : "Execution"}</span></div><StatusPill status={execution.status} /></button>) : <div className="list-empty">No executions yet. Choose a plan above to start your first research run.</div>}
      </section>
      <section className="execution-detail">
        {!selectedExecution ? <div className="empty-state compact"><Play size={26} /><h3>Select an execution</h3><p>Your execution status, source pages and research findings will appear here.</p></div> : <>
          <div className="execution-detail-head"><div><div className="eyebrow">EXECUTION DETAILS</div><h3>{plans.find((p) => p._id === selectedExecution.planId)?.plan?.title || "Research execution"}</h3><p className="muted">Started {selectedExecution.startedAt ? new Date(selectedExecution.startedAt).toLocaleString() : "—"}</p></div><StatusPill status={selectedExecution.status} /></div>
          <div className="execution-metrics"><div><strong>{selectedExecution.totalTasks}</strong><span>Total tasks</span></div><div><strong>{selectedExecution.completedTasks}</strong><span>Completed</span></div><div><strong>{selectedExecution.failedTasks}</strong><span>Failed</span></div><div><strong>{detail?.sources?.length ?? "—"}</strong><span>Sources</span></div></div>
          <div className="plan-progress"><div><strong>Task progress</strong><span>{progress}%</span></div><div className="progress-track"><div style={{ width: `${progress}%` }} /></div></div>
          {selectedExecution.lastError && <div className="warning-box"><AlertTriangle size={14} /> {selectedExecution.lastError}</div>}
          <div className="execution-subsection"><h4>Task results</h4>{selectedExecution.tasks?.map((task, index) => <div className="execution-task" key={`${task.areaIndex}-${task.taskIndex}-${index}`}><div className="execution-task-status">{task.status === "completed" ? <CheckCircle2 size={17} /> : task.status === "failed" ? <AlertTriangle size={17} /> : <Circle size={17} />}</div><div><strong>{task.title}</strong><span>{task.areaName} · {task.priority} priority</span>{task.error && <small className="error-text">{task.error}</small>}</div><StatusPill status={task.status} /></div>)}</div>
          <div className="execution-subsection"><h4>Research findings <span>{detail?.findings?.length ?? 0}</span></h4>{detailQuery.isLoading ? <div className="list-empty">Loading findings…</div> : detailQuery.isError ? <div className="error-box">{(detailQuery.error as Error).message}</div> : detail?.findings?.length ? detail.findings.map((finding) => <article className="finding-card" key={finding._id}><div className="finding-top"><span className="finding-label"><ShieldCheck size={13} /> EVIDENCE CLAIM</span><strong>{Math.round(finding.confidence * 100)}% confidence</strong></div><h5>{finding.claim}</h5><p>{finding.explanation}</p><div className="finding-sources">{finding.sourceIds?.map((source, i) => { const id = typeof source === "string" ? source : source._id; const resolved = detail.sources.find((item) => item._id === id) || (typeof source === "string" ? undefined : source); return resolved ? <a key={id || i} href={resolved.url} target="_blank" rel="noreferrer">{resolved.domain || resolved.title} <ExternalLink size={11} /></a> : null; })}</div></article>) : <div className="list-empty">No findings were saved for this execution.</div>}</div>
          <div className="execution-subsection"><h4>Collected sources <span>{detail?.sources?.length ?? 0}</span></h4>{detail?.sources?.length ? detail.sources.map((source) => <a className="execution-source" href={source.url} target="_blank" rel="noreferrer" key={source._id}><div><strong>{source.title}</strong><span>{source.domain} · {source.fetchedAt ? new Date(source.fetchedAt).toLocaleString() : "Fetched source"}</span></div><ExternalLink size={14} /></a>) : <div className="list-empty">No sources saved for this execution.</div>}</div>
        </>}
      </section>
    </div>
  </div>;
}

function Assistant({ projectId }: { projectId: string }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string; sources?: any[] }[]>([]);
  const ask = useMutation({ mutationFn: (q: string) => workspaceApi.ask(projectId, q), onSuccess: (answer, q) => { setMessages(prev => [...prev, { role: "assistant", text: answer.answer, sources: answer.sources || [] }]); setQuestion(""); }, onError: e => setMessages(prev => [...prev, { role: "assistant", text: `I couldn't complete that request: ${(e as Error).message}` }]) });
  function submit(e: FormEvent) { e.preventDefault(); const q = question.trim(); if (!q || ask.isPending) return; setMessages(prev => [...prev, { role: "user", text: q }]); ask.mutate(q); }
  return <div className="assistant-shell"><div className="assistant-intro"><div className="assistant-avatar"><Bot size={23} /></div><div><h2>Research assistant</h2><p>Ask questions grounded in the documents uploaded to this project.</p></div><span className="local-chip"><span className="status-dot" /> Qwen · Local</span></div><div className="chat-area">{messages.length === 0 ? <div className="chat-empty"><div className="chat-empty-icon"><MessageSquare size={26} /></div><h3>What would you like to understand?</h3><p>Ask a question about your uploaded research material. Answers include source references when available.</p><div className="suggestions">{["What are the main findings in my documents?", "Summarize the key challenges discussed.", "What recommendations do the sources make?"].map(q => <button key={q} onClick={() => setQuestion(q)}>{q} <ArrowUpRight size={14} /></button>)}</div></div> : <div className="messages">{messages.map((m, i) => <div className={`message ${m.role}`} key={i}><div className="message-avatar">{m.role === "assistant" ? <Bot size={16} /> : "R"}</div><div className="message-content"><div className="message-role">{m.role === "assistant" ? "ResearchOS" : "You"}</div><p>{m.text}</p>{m.sources?.length ? <div className="source-list"><strong>Sources</strong>{m.sources.map((s: any, j: number) => <span key={j}>[{s.reference ?? j + 1}] {s.filename}{s.page ? ` · Page ${s.page}` : ""}</span>)}</div> : null}</div></div>)}{ask.isPending && <div className="thinking"><span /><span /><span /> ResearchOS is thinking…</div>}</div>}</div><form className="chat-composer" onSubmit={submit}><textarea rows={2} value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask a question about your documents…" onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(e); } }} /><button className="send-btn" disabled={!question.trim() || ask.isPending} aria-label="Send question"><Send size={17} /></button><div className="composer-hint">AI responses can be inaccurate. Verify important claims against the cited sources.</div></form></div>;
}

function Sessions({ projectId }: { projectId: string }) {
  const { data = [], isLoading, error } = useQuery({ queryKey: ["sessions", projectId], queryFn: () => workspaceApi.sessions(projectId) });
  return <div className="content-section"><div className="section-heading"><div><h2>Research sessions</h2><p className="muted">Sessions associated with this project.</p></div></div><div className="list-card">{isLoading ? <div className="list-empty">Loading sessions…</div> : error ? <div className="list-empty error-text">{(error as Error).message}</div> : data.length ? data.map((s: ResearchSession) => <div className="document-row" key={s._id}><div className="file-type session-type"><MessageSquare size={17} /></div><div className="file-info"><strong>{s.title || s.objective || "Research session"}</strong><span>{s.createdAt ? new Date(s.createdAt).toLocaleString() : "Session"}</span></div><StatusPill status={s.status} /></div>) : <div className="list-empty">No research sessions yet.</div>}</div></div>;
}
