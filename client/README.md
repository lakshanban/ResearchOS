# ResearchOS Frontend v3 — Execution Workspace

React + TypeScript + Vite frontend for the ResearchOS backend. This version retains the project, document-upload, RAG and research-planning experience, and adds the Phase 6.7 research execution workspace for starting executions and inspecting persisted task results, sources and findings.

## Requirements

- Node.js 20+
- ResearchOS backend running at `http://localhost:4000`
- MongoDB, Qdrant and Ollama running as configured by the backend

## Install and run

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173.

The Vite development server proxies `/api/*` to `http://localhost:4000`. If your backend uses another port, edit `vite.config.ts`.

## Included screens

- Dashboard and project listing
- Create project
- Project overview
- Research sessions list
- Document upload (PDF, DOCX, TXT) and document list
- Ask questions over uploaded documents (RAG)
- Generate research plans using the Phase 5.5 endpoint
- Browse saved research plans and update task status
- Start LangGraph research executions from saved plans
- Browse execution history and task progress
- Inspect persisted source pages and evidence findings with source links
- Responsive sidebar and mobile navigation

## Backend endpoints used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:projectId` | Project details |
| GET | `/api/projects/:projectId/sessions` | List sessions |
| GET | `/api/projects/:projectId/documents` | List documents |
| POST | `/api/projects/:projectId/documents` | Upload document (`document` form field) |
| POST | `/api/projects/:projectId/documents/ask` | RAG question |
| POST | `/api/projects/:projectId/research-plans/generate` | Generate and save plan |
| GET | `/api/projects/:projectId/research-plans` | List saved plans |
| GET | `/api/projects/:projectId/research-plans/:planId` | Get one plan |
| PATCH | `/api/projects/:projectId/research-plans/:planId/tasks/:areaIndex/:taskIndex` | Update task status |
| POST | `/api/projects/:projectId/research-executions` | Start execution for `{ "planId": "..." }` (request waits for workflow completion) |
| GET | `/api/projects/:projectId/research-executions` | List project executions |
| GET | `/api/projects/:projectId/research-executions/:executionId` | Retrieve execution, sources and findings |

## API response expectations

The frontend accepts the common `{ success, data }` response wrapper, including arrays and objects. It expects project fields such as `_id`, `title`, `objective`, and timestamps. If your Phase 2 API uses different property names, update the normalizers in `src/api/normalizers.ts`.

The research-plan API follows the Phase 5.5 controller shape:
- `data` is a plan object for generation / get-one
- `data` is an array for list
- saved plan fields include `_id`, `objective`, `plan`, `status`, `retryCount`, `isValid`, `validationErrors`
- task status updates use numeric area/task indexes and `pending | in_progress | completed`

## Notes

- This is a local-development UI. It does not implement authentication; it relies on the backend's current `local-user` development ownership behavior.
- The RAG assistant is project-scoped and displays source references returned by the backend.
- API errors are surfaced in the UI. The frontend does not silently create fake project or research-plan records.


## Phase 6.7 execution UI notes

- Open a project and select the **Executions** tab.
- Select a saved plan with unfinished tasks and choose **Start research**.
- The current backend endpoint runs synchronously, so the browser waits for the workflow to finish before showing the saved execution. The UI increases the Axios request timeout to 10 minutes.
- Execution history refreshes periodically. Select an execution to inspect task statuses, collected source links and saved findings.
- Live task-by-task progress is not yet streamed by the current backend service; the page reflects persisted execution records.

The frontend expects the Phase 6.7 API response shape `{ success, data }` and the execution detail shape `{ execution, sources, findings }`.
