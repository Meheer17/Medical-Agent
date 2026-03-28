from contextlib import asynccontextmanager

from fastapi import FastAPI

from backend.core.config import get_settings
from backend.core.logger import configure_logging, get_logger
from backend.core.database import Base, engine
from backend.llm.provider_factory import build_llm_provider
from backend.routers.health import router as health_router
from backend.routers.auth import router as auth_router
from backend.routers.patients import router as patients_router
from backend.routers.triage import router as triage_router
from backend.routers.doctors import router as doctors_router
from backend.routers.insurance import router as insurance_router
from backend.routers.appointments import router as appointments_router
from backend.routers.chat import router as chat_router

settings = get_settings()
configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting application", extra={"env": settings.environment})
    Base.metadata.create_all(engine)
    app.state.llm_provider = build_llm_provider(settings)
    yield
    logger.info("Shutting down application")


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(triage_router)
app.include_router(doctors_router)
app.include_router(insurance_router)
app.include_router(appointments_router)
app.include_router(chat_router)


@app.get("/", summary="Root")
def root() -> dict[str, str]:
    return {"message": "Autonomous Medical Triage Orchestrator backend"}
