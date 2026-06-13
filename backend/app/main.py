import logging
import time

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.router import router as api_router
from app.core.config import settings
from app.core.database import Base, engine
from app.core.logging import setup_logging
from app.core.responses import error
from app.utils.seed import seed_default_data

setup_logging()
logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)
seed_default_data()

app = FastAPI(title=settings.app_name, version=settings.app_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    return {"status": "ok", "version": settings.app_version}
