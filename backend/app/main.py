from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.controllers.router import api_router
from app.core.access_log import AccessLogMiddleware
from app.core.config import get_settings
from app.core.error_handlers import register_error_handlers
from app.core.logging import configure_logging


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(
        title="Passe API",
        description="Mercado de jogadores, clubes e liga do estudo de caso SENAI/PE.",
        version="1.0.0",
        redirect_slashes=False,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Content-Type", "Accept"],
        expose_headers=["Location", "Content-Disposition"],
    )
    app.add_middleware(AccessLogMiddleware)
    register_error_handlers(app)
    app.include_router(api_router)
    return app


app = create_app()
