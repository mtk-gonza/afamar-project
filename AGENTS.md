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
    models/        — SQLAlchemy ORM models (Client, Budget, WorkOrder, Material, PoolStock, Setting, AppOption, Measurement, OnlineBudget, PriceHistory)
    schemas/       — Pydantic request/response schemas
    api/v1/        — REST endpoints grouped by resource
    services/      — business logic layer (budget, work_order, material, measurement, online_budget, report, whatsapp)
    repositories/  — data access layer (one per model)
    utils/         — auto-numbering (P-000001, A-000001), seed data, pagination
  requirements.txt
  alembic/         — migration scripts (85179924c32e is head)
  .env             — DATABASE_URL, CORS_ORIGINS, etc.

frontend/          — Vite + React + TS
  src/
    main.tsx       — React entrypoint
    App.tsx        — BrowserRouter + route definitions (all pages)
    api/
      client.ts    — typed API client (methods per resource)
      http.ts      — Axios instance with base URL + interceptors
    types/         — shared TypeScript interfaces
    hooks/         — useApi (data fetching), useMutation
    context/       — NotificationContext with useNotify toast system
    components/    — Layout (collapsible sidebar, grouped nav, logo), ErrorBoundary
    pages/         — one folder per module (Dashboard, Budgets, WorkOrders, Clients, Materials, PoolStock, Measurements, OnlineBudgets, Calculator, Reports, Settings)
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
- Use `Optional[date]` / `Optional[datetime]` (not `date | None`) in Pydantic schemas for Python 3.14 compatibility
- `style={{ gridColumn: "1 / -1" }}` for full-width fieldsets/fields in forms
- fieldset + legend pattern for form sections in enhanced forms (BudgetForm, WorkOrderForm)
- Bar chart implemented with inline div styles (Dashboard monthly bars, Reports sales chart)

## Commands

```bash
# Backend
cd backend
.\venv\Scripts\pip install -r requirements.txt
.\venv\Scripts\uvicorn app.main:app --reload        # dev server at :8000
.\venv\Scripts\ruff check .                         # lint
.\venv\Scripts\pytest                                # tests

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
- Seed runs on startup if `material_categories` table is empty — creates categories, colors, thicknesses, spec options, settings defaults, common materials with base prices, PriceHistory, and company_logo setting.
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
- Dual currency support: Budget and WorkOrder have ARS fields (`total`, `subtotal`, etc.) and USD fields (`total_usd`, `subtotal_usd`, `transport_usd`) plus `usd_rate` for exchange rate.
- Budget enhancement fields: `adicionales` (separate table), `pool_id`/`pool_price`/`pool_currency`, `deposit_received`/`deposit_usd`/`balance_due`/`balance_due_usd`/`balance_paid`, `payment_method`/`installments`, `digital_signature`/`signed_at`, `snapshot_name/phone/email/address`, `design_observations`/`important_observations`/`fabrication_details`, `estimated_date`/`validity_days`, `materials_data`/`pools_data`.
- WorkOrder fields mirror Budget dual currency + financial fields + `fabrication_details`/`budgeted_details`/`design_observations`/`important_observations`.
- Budget list page columns: Número, Cliente, Estado, Total ARS, Total USD, Saldo, Fecha, Acciones (Editar, Aprobar, PDF, Email, WA, Eliminar).
- WorkOrder list page columns: Número, Cliente, Estado, Prioridad, Total ARS, Total USD, Saldo, Entrega, Acciones.
- Layout has collapsible sidebar with toggle button, grouped nav sections (General/Inventario/Operaciones/Administración), and logo from settings.
- Dashboard shows branded header, stat cards (including online_budgets count), bar chart by status, recent budgets/orders lists.
- Reports page: monthly sales bar chart, most-used materials table, budget status filter, orders in production section.
- Calculator page implements m² computation with ARS/USD conversion.
- Settings page has logo upload (file → base64 + URL input with preview).
- Layout loads `settings.company_logo` for logo image (with onError fallback to text logo).

## Python 3.14 notes

- **Pydantic + Python 3.14:** Use `Optional[date]` / `Optional[datetime]` instead of `date | None` / `datetime | None` in Pydantic schemas. The PEP 604 union syntax causes `TypeError: unsupported operand type(s) for |: 'NoneType' and 'NoneType'` because Pydantic's `eval_type_backport` in Python 3.14 can't resolve `date`/`datetime` in its ForwardRef evaluation context.
- Regular `str | None`, `int | None`, `float | None` work fine since those are built-in types.

## Relevant files

- `frontend/src/types/index.ts`: All TypeScript interfaces (updated with Measurement, OnlineBudget, PriceHistory, SearchResults, BudgetAdicional, BudgetSketchElement, enhanced Budget/WorkOrder/Material/PoolStock).
- `frontend/src/api/client.ts`: All API methods (includes search, reports, measurements, online_budgets, whatsapp, most_used_materials).
- `frontend/src/pages/Budgets/BudgetForm.tsx`: Enhanced with dual currency, adicionales section, pool selection, financial fields, client snapshot, 4 observation textareas, signature.
- `frontend/src/pages/Budgets/BudgetForm.module.css`: CSS grid for item/adicional rows, fieldset styling.
- `frontend/src/pages/Budgets/Budgets.tsx`: List with new columns (USD, balance) and action buttons (PDF, Email, WA).
- `frontend/src/pages/WorkOrders/WorkOrderForm.tsx`: Enhanced with status transitions, fabrication details, pool, dual currency, financial fields, snapshot.
- `frontend/src/pages/WorkOrders/WorkOrders.tsx`: Enhanced table columns + Kanban card info.
- `frontend/src/pages/Dashboard/Dashboard.tsx`: Branded header, bar chart, recent items, online budgets card.
- `frontend/src/pages/Reports/Reports.tsx`: Monthly sales bar chart, most-used materials, budget status filter.
- `frontend/src/pages/Settings/Settings.tsx`: Logo upload field (file + URL).
- `frontend/src/components/Layout/Layout.tsx`: Collapsible sidebar, grouped nav, logo from settings.
- `frontend/src/components/Layout/Layout.module.css`: Collapse styles, logo img, nav groups.
- `frontend/src/pages/Measurements/`: New page with list, form, status dropdown.
- `frontend/src/pages/OnlineBudgets/`: New page with list, form, pool selector.
- `frontend/src/pages/Calculator/`: New calculator with m² and ARS/USD.
- `backend/app/schemas/budget.py`: Pydantic schemas with all enhanced fields (uses `Optional[date]`/`Optional[datetime]`).
- `backend/app/schemas/work_order.py`: WorkOrder schemas (uses `Optional[date]`/`Optional[datetime]`).
- `backend/app/schemas/measurement.py`: Measurement schemas.
- `backend/app/schemas/online_budget.py`: OnlineBudget schemas.
- `backend/app/services/*.py`: All services (budget, work_order, material, measurement, online_budget, report, whatsapp).
- `backend/app/api/v1/*.py`: All API endpoints (budgets, work_orders, materials, measurements, online_budgets, whatsapp, search, reports, router).
- `backend/alembic/versions/85179924c32e_add_new_models_and_columns.py`: Migration for all new tables/columns.
- `backend/app/utils/seed.py`: Seed with PriceHistory and company_logo.
- `backend/app/core/config.py`: WhatsApp settings added.
- `backend/requirements.txt`: `requests` added.
