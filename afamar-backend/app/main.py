import logging
import time
from contextlib import asynccontextmanager
from pathlib import Path

from alembic import command
from alembic.config import Config as AlembicConfig
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.router import router as api_router
from app.core.config import settings
from app.core.database import Base, engine, sync_schema
from app.core.logging import setup_logging, check_database
from app.core.responses import error
from app.models import *  # noqa: F401, F403
from app.utils.seed import seed_default_data

setup_logging()
logger = logging.getLogger(__name__)


def run_migrations():
    alembic_cfg = AlembicConfig("alembic.ini")
    try:
        command.upgrade(alembic_cfg, "head")
    except Exception:
        logger.warning("Alembic upgrade failed — stamping head instead", exc_info=True)
        try:
            command.stamp(alembic_cfg, "head")
        except Exception:
            logger.warning("Alembic stamp also failed", exc_info=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)
    logger.info("Environment: %s", settings.ENVIRONMENT)
    logger.info("Database: %s", settings.DATABASE_URL_SAFE)
    logger.info("Frontend URL: %s", settings.FRONTEND_URL)
    logger.info("-" * 60)
    
    ok, msg = check_database()
    if ok:
        logger.info("Database check: %s", msg)
        try:
            logger.info("Database initialized")
        except Exception as e:
            logger.exception("Database initialization failed: %s", e)
            raise
    else:
        logger.error("Database check: %s", msg)
        raise RuntimeError(msg)
    Base.metadata.create_all(bind=engine)
    sync_schema()
    alembic_cfg = AlembicConfig("alembic.ini")
    try:
        command.stamp(alembic_cfg, "head")
    except Exception:
        logger.warning("Could not stamp alembic head", exc_info=True)
    seed_default_data()
    yield


app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

app.include_router(api_router)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = (time.perf_counter() - start) * 1000
    logger.info("%s %s — %s (%.0fms)", request.method, request.url.path, response.status_code, elapsed)
    return response


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_request: Request, exc: StarletteHTTPException):
    return error(detail=exc.detail, status_code=exc.status_code)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    return error(detail=str(exc.errors()), status_code=422)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception):
    logger.exception("Unhandled error")
    return error(detail="Internal server error", status_code=500)


@app.get("/health")
def health():
    return {"status": "ok", "version": settings.APP_VERSION}
