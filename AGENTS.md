# AGENTS.md

## Stack

- **Backend:** Python 3.14 + FastAPI + SQLAlchemy + SQLite (swappable to MySQL via `DATABASE_URL`)
- **Frontend:** Vite + React 19 + TypeScript + CSS Modules (BEM naming)
- **DB Migrations:** Alembic

## Project structure

```
backend/           — FastAPI app
  app/
    main.py        — entrypoint, creates all tables on startup
    core/          — config, database engine, dependencies
    models/        — SQLAlchemy ORM models (Client, Budget, WorkOrder, Material, PoolStock, Setting, AppOption)
    schemas/       — Pydantic request/response schemas
    api/v1/        — REST endpoints grouped by resource
    services/      — business logic layer
    repositories/  — data access layer (one per model)
    utils/         — auto-numbering (P-000001, A-000001), seed data, pagination
  requirements.txt
  alembic/         — migration scripts
  .env             — DATABASE_URL, CORS_ORIGINS, etc.

frontend/          — Vite + React + TS
  src/
    main.tsx       — React entrypoint
    App.tsx        — BrowserRouter + route definitions
    api/
      client.ts    — typed API client (methods per resource)
      http.ts      — Axios instance with base URL + interceptors
    types/         — shared TypeScript interfaces
    hooks/         — useApi (data fetching), useMutation
    context/       — NotificationContext with useNotify toast system
    components/    — Layout (sidebar nav), ErrorBoundary
    pages/         — one folder per module (Dashboard, Budgets, WorkOrders, Clients, …)
    styles/        — global CSS, each component has own .module.css with BEM
```

## Key conventions

- CSS Modules with BEM: `styles["block__element--modifier"]`
- Repository pattern for DB access, Service layer for business logic
- `/api/v1/...` prefix for all endpoints
- Every route has `get_db` dependency injection for the DB session
- Budget numbering: `P-000001`; Work Order numbering: `A-000001`
- Budget → Work Order conversion: `POST /api/v1/work-orders/from-budget/{id}`
- Switching DB: change `DATABASE_URL` in `.env` (SQLite → `mysql+pymysql://user:pass@host/db`)
- Standardized API response envelope: `{ success, data, error, pagination? }`
- Forms use `Promise.allSettled` for initial data loading with `dataLoading`/`dataError` states
- Notification toasts via `useNotify()` from NotificationContext
- Material model has `base_price` for auto-fill in budget items

## Commands

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload        # dev server at :8000
ruff check .                         # lint
pytest                               # tests

# Frontend
cd frontend
npm install
npm run dev                          # dev server at :5173
npm run build                        # production build (tsc + vite)
npm run preview                      # preview production build
```

## Architecture notes

- README.md at root has full step-by-step setup instructions.
- Docker compose with multi-stage images (backend + frontend), external network `infra-net`.
- Backend creates all tables on first import (`Base.metadata.create_all`) — Alembic should be used for schema changes after initial setup.
- `Setting` (app config) uses key-value model with a `Setting` DB table; `Settings` (pydantic-settings) reads `.env` for app-level config.
- PDF generation uses `reportlab` — `services/pdf.py` has a reference implementation.
- `order` is quoted in SQLAlchemy models because it's a reserved word.
- Seed runs on startup if `material_categories` table is empty — creates categories, colors, thicknesses, spec options, settings defaults, and common materials with base prices.
- **Test infrastructure:** `conftest.py` uses a file-based SQLite (`tempdir/afamar_test.db`) instead of `:memory:` because TestClient runs route handlers in an async worker thread, and in-memory SQLite is per-connection/per-thread — file-based DB is shared across threads.
- **Test fixture ordering:** `client` fixture depends on `setup_db` (autouse) so tables are created before TestClient handles requests.
- **Test dependency override:** Must override `app.core.dependencies.get_db` (not `app.core.database.get_db`) because all routes import the former.
- **Test seeding:** Use `seed_db` fixture (defined in conftest) for tests needing reference data (categories, colors, thicknesses, app options, settings). It depends on `setup_db` so tables are created first.
- Material `base_price` (Float, default 0.0) allows auto-filling item unit_price in BudgetForm when a material is selected.
- Loading states use pattern: `dataLoading=true` → selects disabled with "Cargando..."; `dataError` → error block with retry button.
- List pages (Budgets, WorkOrders, etc.) show loading spinner, error block, and empty-state message.
- BudgetForm autofills item unit_price from material's `base_price` when material selection changes.
- WorkOrders page has view toggle: Table view (default) and Kanban view grouped by status columns.
- `api/client.ts` uses typed wraps — each method typed with proper response interface instead of `any`.
- `api/client.ts` mutation methods (`create*`, `update*`) use `data: any` instead of `data: Partial<T>` because forms pass shape-mismatched data (e.g. `ItemRow[]` instead of `BudgetItem[]`).
- `vite.config.ts` has a proxy (`/api` → `http://localhost:8000`) so in dev mode requests go through Vite, avoiding CORS. The default `http.ts` `baseURL` is `/api/v1` (relative). Override via `VITE_API_URL` env var for production.
