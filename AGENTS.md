# AGENTS.md

## Stack

- **Backend:** Python 3.14 + FastAPI + SQLAlchemy + SQLite (swappable to MySQL via `DATABASE_URL`)
- **Frontend:** Vite + React 19 + TypeScript + CSS Modules (BEM naming)
- **DB Migrations:** Alembic
- **Status/Reference tables:** `budget_statuses`, `work_order_statuses`, `payment_methods`, `priority_levels`, `finish_types` (seeded via migration, managed via `/api/v1/references/{resource}` endpoints)
- **Budget statuses (string):** `PENDIENTE`, `ONLINE`, `APROBADO`, `RECHAZADO`, `CONVERTIDO A OT`
- **WorkOrder statuses (string):** `MEDICION`, `TALLER`, `TERMINADA`, `ENTREGADA`, `CANCELADO`

## Auth system

- **Backend JWT auth:** `POST /api/v1/auth/login` → returns `access_token` + `user`
- **User model:** `users` table with username, email, hashed_password, full_name, is_active, is_admin
- **Password hashing:** passlib bcrypt (requires bcrypt==4.1.3 for passlib compatibility)
- **Seed admin user:** created on startup if no users exist → `admin` / `admin123`
- **Protected routes:** backend uses `get_current_user` dependency (Bearer token) — currently admin routes NOT protected at API level (TODO: add `Depends(get_current_user)` to each router)
- **Frontend auth:** `AuthContext` stores user + token in localStorage, axios interceptor adds Bearer header
- **Frontend routing:** 
  - `/` — public landing page
  - `/login` — login page
  - `/admin` — protected admin area (all original routes under `/admin/*`)
  - `ProtectedRoute` component redirects to `/login` if not authenticated
  - On 401 response, auto-clears auth and redirects to `/login`

## Project structure

```
afamar-backend/    — FastAPI app
  app/
    main.py        — entrypoint, creates all tables on startup
    core/          — config, database engine, dependencies
    models/        — SQLAlchemy ORM models (Client, Budget, WorkOrder, Material, PoolStock, Setting, AppOption, Measurement, OnlineBudget, PriceHistory, reference tables)
    schemas/       — Pydantic request/response schemas (includes reference.py)
    api/v1/        — REST endpoints grouped by resource (includes references.py)
    services/      — business logic layer (budget, work_order, material, measurement, online_budget, report, whatsapp)
    repositories/  — data access layer (one per model)
    utils/         — auto-numbering (P-000001, A-000001), seed data, pagination
  requirements.txt
  alembic/         — migration scripts (26893c0fdbc9 is head)
  .env             — DATABASE_URL, CORS_ORIGINS, etc.

afamar-frontend/   — Vite + React + TS
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
    pages/         — one folder per module (Dashboard, Budgets, WorkOrders, Clients, Materials, PoolStock, Measurements, OnlineBudgets, Calculator, Reports, Settings, DailyCash)
    styles/        — global CSS, each component has own .module.css with BEM
```

Note: both project folders carry the `afamar-` prefix (afamar-backend, afamar-frontend) so the monorepo can host multiple projects without name collisions.

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
cd afamar-backend
.\venv\Scripts\pip install -r requirements.txt
.\venv\Scripts\uvicorn app.main:app --reload --port 3095        # dev server at :3095
.\venv\Scripts\ruff check .                         # lint
.\venv\Scripts\pytest                                # tests

# Frontend
cd afamar-frontend
npm install
npm run dev                          # dev server at :3090
npm run build                        # production build (tsc + vite)
npm run preview                      # preview production build
```

## Architecture notes

- README.md at root has full step-by-step setup instructions.
- Docker compose with multi-stage images (backend + frontend), external network `infra-net`.
- Backend creates all tables on first import (`Base.metadata.create_all`) — Alembic should be used for schema changes after initial setup.
- `Setting` (app config) uses key-value model with a `Setting` DB table; `Settings` (pydantic-settings) reads `.env` for app-level config.
- PDF generation uses `xhtml2pdf` + Jinja2 templates — `services/pdf_html.py` is the primary PDF service. `services/pdf.py` (reportlab) remains as legacy fallback.
- Templates in `app/templates/presupuesto_pdf.html` and `app/templates/orden_pdf.html` render via Jinja2 → xhtml2pdf → PDF bytes.
- `services/pdf_html.py` has `generate_budget_pdf(data)`, `generate_work_order_pdf(data)`, `build_budget_pdf_data(budget_data, client_dict, company, terms)`, and `build_work_order_pdf_data(order_data, client_dict, company, terms)` for converting from router payload format.
- Internal PDF helpers: `_simplify_concept`, `_prepare_data`, `_combine_and_sort_items`, `_sketch_to_png_base64_list`.
- Templates: `budget_pdf.html`, `work_order_pdf.html`.
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
- `vite.config.ts` has a proxy (`/api` → `http://localhost:3095`) so in dev mode requests go through Vite, avoiding CORS. The default `http.ts` `baseURL` is `/api/v1` (relative). Override via `VITE_API_URL` env var for production.
- Dual currency support: Budget and WorkOrder have ARS fields (`total`, `subtotal`, etc.) and USD fields (`total_usd`, `subtotal_usd`, `transport_usd`) plus `usd_rate` for exchange rate.
- Reference tables (budget_statuses, work_order_statuses, payment_methods, priority_levels, finish_types) are created by Alembic migration and seeded with initial values (Spanish status keys, payment methods, priority levels, finish types). The FK columns on budgets/work_orders reference these tables but the string `status`/`priority`/`payment_method` fields remain as denormalized copies for backward compatibility.
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
- **Pillow + Python 3.14:** Use `Pillow>=11.1.0,<12.0` (current pin in `afamar-backend/requirements.txt`). Pillow 10.x has no `cp314` wheels, so pip falls back to a source build and fails with `Failed building wheel for Pillow` unless a C toolchain is installed. Branch 11.1+ ships pre-built `cp314` wheels and is API-compatible with the only PIL usage in `app/services/pdf_html.py` (`Image.new` + `ImageDraw`).

## Relevant files

- `afamar-frontend/src/types/index.ts`: All TypeScript interfaces (updated with Measurement, OnlineBudget, PriceHistory, SearchResults, BudgetAdicional, BudgetSketchElement, enhanced Budget/WorkOrder/Material/PoolStock).
- `afamar-frontend/src/api/client.ts`: All API methods (includes search, reports, measurements, online_budgets, whatsapp, most_used_materials).
- `afamar-frontend/src/pages/Budgets/BudgetForm.tsx`: Enhanced with dual currency, adicionales section, pool selection, financial fields, client snapshot, 4 observation textareas, signature.
- `afamar-frontend/src/pages/Budgets/BudgetForm.module.css`: CSS grid for item/adicional rows, fieldset styling.
- `afamar-frontend/src/pages/Budgets/Budgets.tsx`: List with new columns (USD, balance) and action buttons (PDF, Email, WA).
- `afamar-frontend/src/pages/WorkOrders/WorkOrderForm.tsx`: Enhanced with status transitions, fabrication details, pool, dual currency, financial fields, snapshot.
- `afamar-frontend/src/pages/WorkOrders/WorkOrders.tsx`: Enhanced table columns + Kanban card info.
- `afamar-frontend/src/pages/Dashboard/Dashboard.tsx`: Branded header, bar chart, recent items, online budgets card.
- `afamar-frontend/src/pages/Reports/Reports.tsx`: Monthly sales bar chart, most-used materials, budget status filter.
- `afamar-frontend/src/pages/Settings/Settings.tsx`: Logo upload field (file + URL).
- `afamar-frontend/src/components/Layout/Layout.tsx`: Collapsible sidebar, grouped nav, logo from settings.
- `afamar-frontend/src/components/Layout/Layout.module.css`: Collapse styles, logo img, nav groups.
- `afamar-frontend/src/pages/Measurements/`: Page with list, form, status dropdown.
- `afamar-frontend/src/pages/OnlineBudgets/`: Page with list, form, pool selector.
- `afamar-frontend/src/pages/Calculator/`: Calculator with m² and ARS/USD.
- `afamar-frontend/src/pages/DailyCash/`: Cash module with DailyCashPage (daily form) and CashHistory (closed days history).
- `afamar-backend/app/schemas/budget.py`: Pydantic schemas with all enhanced fields (uses `Optional[date]`/`Optional[datetime]`).
- `afamar-backend/app/schemas/work_order.py`: WorkOrder schemas (uses `Optional[date]`/`Optional[datetime]`).
- `afamar-backend/app/schemas/measurement.py`: Measurement schemas.
- `afamar-backend/app/schemas/online_budget.py`: OnlineBudget schemas.
- `afamar-backend/app/services/*.py`: All services (budget, work_order, material, measurement, online_budget, report, whatsapp).
- `afamar-backend/app/api/v1/*.py`: All API endpoints (budgets, work_orders, materials, measurements, online_budgets, whatsapp, search, reports, router).
- `afamar-backend/app/models/reference.py`: Reference tables (BudgetStatus, WorkOrderStatus, PaymentMethod, PriorityLevel, FinishType) with FK relationships to Budget/WorkOrder.
- `afamar-backend/app/schemas/reference.py`: Pydantic schemas for reference CRUD.
- `afamar-backend/app/api/v1/references.py`: Generic CRUD endpoints for all reference tables at `/api/v1/references/{resource}`.
- `afamar-backend/alembic/versions/c1b5500fd00b_add_reference_fks_and_missing_columns.py`: Adds FK columns (`status_id`, `payment_method_id`, `priority_id`, `finish_id`) to `budgets` and `work_orders` tables + seeds reference data.
- `afamar-backend/alembic/versions/26893c0fdbc9_add_daily_cash_and_cash_movements.py`: Creates `daily_cash` and `cash_movements` tables (idempotent, English naming). All column names in English.
- **Cash module (English naming):** `GET /api/v1/cash/daily?query_date=` creates/returns daily cash register; `POST /api/v1/cash/movements` creates INCOME/EXPENSE; `DELETE /api/v1/cash/movements/{id}` removes; `PUT /api/v1/cash/previous-balance` sets opening balance; `POST /api/v1/cash/daily/close` finalizes a day; `GET /api/v1/cash/history` lists closed days.
- Cash backend files: `models/daily_cash.py` (DailyCash + CashMovement), `schemas/daily_cash.py` (CashMovementCreate, UpdatePreviousBalance, CloseCashRequest), `repositories/daily_cash.py` (DailyCashRepository.get_or_create, recalculate), `services/daily_cash.py` (DailyCashService), `api/v1/daily_cash.py` (6 endpoints, protected by auth).
- `DailyCashRepository.recalculate(cash_id)` recomputes totals based on movements. Movement `type`: `INCOME` or `EXPENSE`. `payment_method`: `Efectivo`, `Transferencia`, `Tarjeta`. `expense_type`: `Gasto`, `Transferencia Banco`.
- DB tables: `daily_cash` (date, previous_balance, total_income, total_expenses, total_sum, current_balance, real_cash, is_closed, notes) and `cash_movements` (type, amount, description, payment_method, folder_status, order_id, order_number, order_total, client_name, expense_type, remaining_balance).
- WorkOrder service auto-creates cash movements on deposit: `_create_cash_movement_on_deposit` in `services/work_order.py` creates an INCOME cash movement when a budget is converted to a work order with `deposit_received > 0`, or when deposit is increased during update.
- `afamar-frontend/src/api/resources/references.ts`: Frontend API client for all 5 reference resources.
- `afamar-backend/alembic/versions/85179924c32e_add_new_models_and_columns.py`: Migration for all new tables/columns.
- `afamar-backend/app/utils/seed.py`: Seed with PriceHistory and company_logo.
- `afamar-backend/app/core/config.py`: WhatsApp settings added.
- `afamar-backend/app/utils/seed.py`: Seed with PriceHistory and company_logo.
- `afamar-backend/app/core/config.py`: WhatsApp settings added.
- `afamar-backend/requirements.txt`: `requests` added.
