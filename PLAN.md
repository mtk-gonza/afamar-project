# Plan de mejoras — AFAMAR

## Fase 1: Críticas (seguridad + calidad de vida)

| # | Área | Mejora | Archivos | Estado |
|---|------|--------|----------|--------|
| 1 | Backend | Eliminar código duplicado `run_migrations()` en `lifespan()` | `app/main.py` | ✅ |
| 2 | Backend | `SECRET_KEY` sin default — forzar `.env` | `app/core/config.py` | ✅ |
| 3 | Backend | Proteger TODAS las rutas con `Depends(get_current_user)` | `app/api/v1/*.py` + `router.py` | ✅ (ya estaba) |
| 4 | Frontend | ErrorBoundary en todas las rutas protegidas | `src/App.tsx` + `components/ErrorBoundary/` | ✅ |
| 5 | Frontend | Tipar mutation methods (`data: any` → `CreateXxxInput`) | `src/api/resources/*.ts` | ✅ |
| 6 | Frontend | Alias de imports (`@/` en vez de `../../`) | `vite.config.ts`, `tsconfig.json` | ⏳ |

## Fase 2: Importantes (arquitectura)

| # | Área | Mejora | Archivos | Estado |
|---|------|--------|----------|--------|
| 7 | Backend | BackgroundTasks para email/PDF | `app/api/v1/budgets.py`, `work_orders.py` | ✅ |
| 8 | Backend | Refactor BudgetService (~350 → ~233 líneas) | `app/services/budget.py`, `app/services/budget_calculator.py` | ✅ |
| 9 | Backend | Centralizar manejo de transacciones (Service, no Repository) | `app/services/*.py`, `app/repositories/*.py` | ✅ |
| 10 | Backend | Tests: BudgetService.create + Auth + endpoints críticos | `tests/` | ✅ (37 tests) |
| 11 | Frontend | TanStack Query + hooks por recurso | `src/hooks/`, `src/App.tsx` | ⏳ |

## Fase 3: Buenos para tener (original)

| # | Área | Mejora | Archivos | Estado |
|---|------|--------|----------|--------|
| 12 | Backend | Eliminar `sync_schema()` (frágil en MySQL) | `app/core/database.py`, `app/main.py` | ⏳ |
| 13 | Backend | Rate limiting con `slowapi` | `app/main.py`, `requirements.txt` | ⏳ |
| 14 | Backend | Healthcheck con verificación de DB | `app/main.py` | ⏳ |
| 15 | Frontend | Vitest + tests de componentes | `vitest.config.ts`, `src/**/*.test.tsx` | ⏳ |
| 16 | Infra | Optimizar Dockerfiles (capas npm ci) | `afamar-frontend/Dockerfile` | ⏳ |
| 17 | Infra | `.env.example` con valores documentados | `.env.example` | ⏳ |

---

## Fase 4: Refactor Exhaustivo — Backend (Arquitectura Enterprise)

| # | Área | Mejora | Archivos | Estado |
|---|------|--------|----------|--------|
| 18 | Backend | Reorganizar estructura carpetas: core/, models/, schemas/, repositories/, services/, api/v1/endpoints/, utils/, tasks/ | `app/**` | ⏳ |
| 19 | Backend | Convenciones nomenclatura estrictas (snake_case archivos, PascalCase clases, UPPER_SNAKE constantes) | `app/**` | ⏳ |
| 20 | Backend | Tipado estricto end-to-end: eliminar `any`, generics en BaseRepository, schemas separados Create/Update/Response | `app/schemas/`, `app/repositories/`, `app/services/` | ⏳ |
| 21 | Backend | BaseRepository genérico con CRUD tipado + queries específicas por repositorio | `app/repositories/base.py`, `app/repositories/*.py` | ⏳ |
| 22 | Backend | Service layer: transacciones centralizadas (commit/refresh solo en service), BackgroundTasks consistentes | `app/services/*.py` | ⏳ |
| 23 | Backend | Eliminar `sync_schema()` y `Base.metadata.create_all` en lifespan (solo dev) | `app/core/database.py`, `app/main.py` | ⏳ |
| 24 | Backend | Security hardening: rate limiting (slowapi+Redis), CORS restrictivo, security headers, input sanitization, audit logging | `app/main.py`, `app/core/security.py`, `app/core/middleware.py`, `requirements.txt` | ⏳ |
| 25 | Backend | Observabilidad: structured logging (structlog), correlation ID, healthchecks (/health, /health/ready), Prometheus metrics | `app/core/logging.py`, `app/main.py`, `requirements.txt` | ⏳ |
| 26 | Backend | Testing robusto: pytest-asyncio, fixtures (db_session, client, auth_client, admin_client, seed_db), coverage ≥80%, hypothesis para cálculos | `tests/`, `pytest.ini`, `requirements.txt` | ⏳ |
| 27 | Backend | OpenAPI spec generation + type generation para frontend | `app/main.py`, `scripts/generate-types.py` | ⏳ |
| 28 | Backend | Docker multi-stage optimizado + docker-compose con healthchecks | `Dockerfile`, `docker-compose.yml` | ⏳ |

## Fase 5: Refactor Exhaustivo — Frontend (Arquitectura Enterprise, Sin Barrel)

| # | Área | Mejora | Archivos | Estado |
|---|------|--------|----------|--------|
| 29 | Frontend | Reorganizar a feature-based: src/features/{budgets,work-orders,clients,materials,measurements,online-budgets,daily-cash,reports,settings,product-photos,dashboard}/ | `src/features/**` | ⏳ |
| 30 | Frontend | Shared code en src/shared/{api,components,hooks,utils,types,constants,context,styles} | `src/shared/**` | ⏳ |
| 31 | Frontend | **Eliminar barrel exports** — imports directos desde archivo origen | `src/**` | ⏳ |
| 32 | Frontend | Alias `@/`, `@features/`, `@shared/` en tsconfig.json + vite.config.ts | `tsconfig.json`, `vite.config.ts` | ⏳ |
| 33 | Frontend | TanStack Query v5: QueryClientProvider, hooks genéricos (useList, useGet, useCreate, useUpdate, useDelete), hooks por feature | `src/shared/api/`, `src/features/*/hooks/` | ⏳ |
| 34 | Frontend | Tipado estricto: generar types desde OpenAPI o sincronizar manualmente, Zod schemas para validación runtime | `src/types/`, `src/features/*/types.ts`, `src/shared/api/` | ⏳ |
| 35 | Frontend | Sistema de design: primitivos UI en shared/components/ui/, compound components, CSS Modules BEM + CSS Variables | `src/shared/components/ui/` | ⏳ |
| 36 | Frontend | Formularios: React Hook Form + Zod en todos los forms, field arrays para items/adicionales | `src/features/*/components/*Form*.tsx` | ⏳ |
| 37 | Frontend | Estado global mínimo: solo Auth, Notifications, References, Theme (Context) | `src/shared/context/` | ⏳ |
| 38 | Frontend | Testing: Vitest + RTL + MSW (unit/integration), Playwright (E2E), coverage ≥70% | `vitest.config.ts`, `src/**/*.test.tsx`, `playwright.config.ts` | ⏳ |
| 39 | Frontend | Performance: code splitting por route (React.lazy), virtualización listas grandes, bundle analyzer | `src/app/routes.tsx`, `vite.config.ts` | ⏳ |
| 40 | Frontend | DX: ESLint + Prettier + TS strict, Husky + lint-staged, Storybook (opcional) | `.eslintrc.json`, `.prettierrc`, `package.json` | ⏳ |

## Fase 6: Contrato Backend-Frontend + Infra

| # | Área | Mejora | Archivos | Estado |
|---|------|--------|----------|--------|
| 41 | Contract | Estandarizar response envelope, error format, pagination, dates ISO 8601, enums English/Spanish, dual currency | `app/core/responses.py`, `src/shared/types/` | ⏳ |
| 42 | Infra | `.env.example` documentado completamente | `.env.example` | ⏳ |
| 43 | Infra | GitHub Actions CI: lint → typecheck → test → build → deploy | `.github/workflows/ci.yml` | ⏳ |
| 44 | Docs | CONTRIBUTING.md / DEVELOPMENT.md con convenciones | `CONTRIBUTING.md` | ⏳ |
| 45 | Docs | ADR (Architecture Decision Records) en docs/adr/ | `docs/adr/` | ⏳ |

---

## Implementación

Cada item se implementa en orden. Después de cada uno se documenta en `AGENTS.md`.

**Prioridad inmediata**: Items 6, 11, 12, 13, 14, 15, 16, 17 (pendientes originales) → luego Fases 4-6 por prioridad de impacto.