from contextlib import asynccontextmanager
from typing import Any, Dict
from datetime import datetime
from dotenv import load_dotenv

from fastapi import FastAPI, status, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from app.db.session import AsyncSessionLocal
from app.db.init_db import add_system_default_data

from app.core.logging import logger
from app.core.config import settings
from app.api.v1.api import api_router
from app.services import geoip_service
from app.ai_brain.graph.hr_graph import build_hr_graph
from app.utils.request import get_client_ip, get_user_agent

# Load environment variables from .env file
load_dotenv()


def _build_postgres_dsn() -> str:
    """
    Chuyển đổi DATABASE_URL (SQLAlchemy format) sang DSN psycopg3.

    SQLAlchemy:  postgresql+asyncpg://user:pass@host:port/db
    psycopg3:    postgresql://user:pass@host:port/db
    """
    url = settings.DATABASE_URL
    return url.replace("postgresql+asyncpg://", "postgresql://")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown events."""
    logger.info(
        "application_startup",
        project_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        api_prefix=settings.API_V1_STR,
    )

    # ── Khởi tạo dữ liệu mặc định ────────────────────────────────────────────
    async with AsyncSessionLocal() as db:
        await add_system_default_data(db)

    # ── GeoIP ─────────────────────────────────────────────────────────────────
    GEOIP_DB_PATH = settings.GEOIP_DB_PATH
    geoip_service.initialize(db_path=GEOIP_DB_PATH)

    # ── LangGraph Checkpointer (AsyncPostgresSaver) ───────────────────────────
    # Mở connection pool tới Postgres dùng psycopg3.
    # setup() chạy idempotent: tạo bảng nếu chưa có, skip nếu đã tồn tại.
    postgres_dsn = _build_postgres_dsn()
    async with AsyncPostgresSaver.from_conn_string(postgres_dsn) as checkpointer:
        await checkpointer.setup()
        logger.info("langgraph_checkpointer_ready", type="AsyncPostgresSaver")

        # Compile graph 1 lần duy nhất → lưu vào app.state
        app.state.checkpointer = checkpointer
        app.state.compiled_graph = build_hr_graph(checkpointer=checkpointer)
        logger.info("langgraph_graph_compiled")

        yield

    # ── Shutdown ──────────────────────────────────────────────────────────────
    logger.info("application_shutdown")
    geoip_service.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# Add validation exception handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors from request data.

    Args:
        request: The request that caused the validation error
        exc: The validation error

    Returns:
        JSONResponse: A formatted error response
    """
    # Log the validation error
    client_ip = get_client_ip(request)
    user_agent = get_user_agent(request)
    logger.error(
        "validation_error",
        client_host=client_ip,
        user_agent=user_agent,
        path=request.url.path,
        errors=str(exc.errors()),
    )

    # Format the errors to be more user-friendly
    formatted_errors = []
    for error in exc.errors():
        loc = " -> ".join([str(loc_part) for loc_part in error["loc"] if loc_part != "body"])
        formatted_errors.append({"field": loc, "message": error["msg"]})

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={"detail": "Validation error", "errors": formatted_errors},
    )

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
# @limiter.limit(settings.RATE_LIMIT_ENDPOINTS["health"][0])
async def health_check(request: Request) -> Dict[str, Any]:
    """Health check endpoint with environment-specific information.

    Returns:
        Dict[str, Any]: Health status information
    """
    logger.info("health_check_called")

    # Check database connectivity
    # db_healthy = await database_service.health_check()
    db_healthy = True

    response = {
        "status": "healthy" if db_healthy else "degraded",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT.value,
        "components": {"api": "healthy", "database": "healthy" if db_healthy else "unhealthy"},
        "timestamp": datetime.now().isoformat(),
    }

    # If DB is unhealthy, set the appropriate status code
    status_code = status.HTTP_200_OK if db_healthy else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(content=response, status_code=status_code)

