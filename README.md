# AFAMAR

Sistema de gestión de presupuestos, órdenes de trabajo, clientes, materiales y stock para una marmolería.

## Stack

- **Backend:** Python 3.14 + FastAPI + SQLAlchemy + SQLite (MySQL via `DATABASE_URL`)
- **Frontend:** Vite + React 19 + TypeScript + CSS Modules (BEM naming)
- **DB Migrations:** Alembic
- **Docker:** Imágenes multi-stage para backend y frontend

---

## Requisitos previos

- **Python 3.14+** — [python.org](https://www.python.org/downloads/)
- **Node.js 20+** — [nodejs.org](https://nodejs.org/)
- **npm 10+** (viene con Node.js)
- **Git**

Verificar instalación:

```bash
python --version
node --version
npm --version
```

---

## 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd afamar-project
```

---

## 2. Backend

### 2.1 Crear entorno virtual e instalar dependencias

```bash
cd backend

# Crear el entorno virtual
python -m venv venv

# Activar (Windows — PowerShell)
venv\Scripts\Activate.ps1

# Activar (Windows — CMD)
venv\Scripts\activate.bat

# Activar (Linux/macOS)
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### 2.2 Configurar variables de entorno

El archivo `.env` ya viene con valores por defecto:

```env
DATABASE_URL=sqlite:///./afamar.db
APP_NAME=AFAMAR
APP_VERSION=1.0.0
DEBUG=true
CORS_ORIGINS=http://localhost:5173
```

> Para usar MySQL cambiar `DATABASE_URL` a:
> `mysql+pymysql://usuario:password@host/nombre_db`

### 2.3 Iniciar el servidor de desarrollo

```bash
uvicorn app.main:app --reload
```

El servidor se levanta en `http://localhost:8000`.

- Documentación interactiva: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

> En el primer inicio crea automáticamente todas las tablas de la base de datos y carga datos semilla (categorías, colores, espesores, materiales comunes con precios, opciones de especificaciones y configuraciones por defecto).

### 2.4 Ejecutar tests

```bash
pytest -v
```

### 2.5 Linter

```bash
ruff check .
```

---

## 3. Frontend

### 3.1 Instalar dependencias

```bash
cd frontend
npm install
```

### 3.2 Iniciar servidor de desarrollo

```bash
npm run dev
```

Se levanta en `http://localhost:5173`. El frontend se comunica con el backend en `http://localhost:8000` (configurado en `.env` del backend mediante `CORS_ORIGINS`).

### 3.3 Build de producción

```bash
npm run build
```

Genera los archivos estáticos en la carpeta `dist/`.

### 3.4 Preview del build

```bash
npm run preview
```

---

## 4. Docker

### Requisitos

- Docker Engine 24+
- Docker Compose v2+

### Levantar todo

```bash
docker compose up -d
```

- Backend en `http://localhost:8000`
- Frontend en `http://localhost:5173`

### Detener

```bash
docker compose down
```

---

## 5. Estructura del proyecto

```
afamar-project/
├── backend/
│   ├── app/
│   │   ├── main.py              # Entrypoint, crea tablas y datos semilla
│   │   ├── core/                # Config, database engine, dependencias
│   │   ├── models/              # Modelos ORM (Client, Budget, WorkOrder, Material, PoolStock, Setting, AppOption)
│   │   ├── schemas/             # Schemas Pydantic request/response
│   │   ├── api/v1/              # Endpoints REST agrupados por recurso
│   │   ├── services/            # Lógica de negocio
│   │   ├── repositories/        # Capa de acceso a datos
│   │   └── utils/               # Auto-numeración, datos semilla, paginación
│   ├── tests/
│   │   ├── conftest.py          # Fixtures de pytest (TestClient, BD en memoria)
│   │   └── test_api.py          # Tests de integración
│   ├── requirements.txt
│   ├── .env
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.tsx             # Entrypoint React
│   │   ├── App.tsx              # Router
│   │   ├── api/                 # Cliente API tipado (axios)
│   │   ├── types/               # Interfaces TypeScript
│   │   ├── hooks/               # useApi, useMutation
│   │   ├── context/             # NotificationContext
│   │   ├── components/          # Layout, ErrorBoundary
│   │   ├── pages/               # Dashboard, Budgets, WorkOrders, Clients, Materials, PoolStock, Settings
│   │   └── styles/              # Estilos globales y módulos CSS con BEM
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── AGENTS.md                    # Contexto para asistentes IA
└── README.md
```

---

## 6. Convenciones principales

- **CSS Modules + BEM:** `styles["block__element--modifier"]`
- **Patrón Repository + Service** para acceso a datos y lógica de negocio
- **Prefix `/api/v1/...`** en todos los endpoints
- **Respuesta API estandarizada:** `{ success, data, error, pagination? }`
- **Numeración automática:** Presupuestos `P-000001`, Órdenes `A-000001`
- **Conversión Presupuesto → Orden:** `POST /api/v1/work-orders/from-budget/{id}`
- **Notificaciones toast:** `useNotify()` desde `NotificationContext`
- **Estados de carga:** `dataLoading=true` → selects deshabilitados con "Cargando..."; `dataError` → bloque de error con botón reintentar

---

## 7. Comandos rápidos

```bash
# Backend
cd backend
venv\Scripts\Activate.ps1        # Activar venv (Windows PowerShell)
pip install -r requirements.txt  # Instalar dependencias
uvicorn app.main:app --reload    # Servidor dev :8000
ruff check .                     # Linter
pytest                           # Tests

# Frontend
cd frontend
npm install                      # Instalar dependencias
npm run dev                      # Servidor dev :5173
npm run build                    # Build producción (tsc + vite)
npm run preview                  # Preview build producción
```
