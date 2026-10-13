from django.conf import settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.controllers.router import api_router
from app.core.access_log import AccessLogMiddleware
from app.core.error_handlers import register_error_handlers


def create_app() -> FastAPI:
    app = FastAPI(
        title="Passe API",
        description="Mercado de jogadores, clubes e liga do estudo de caso SENAI/PE.",
        version="1.0.0",
        redirect_slashes=False,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Content-Type", "Accept"],
        expose_headers=["Location", "Content-Disposition"],
    )
    app.add_middleware(AccessLogMiddleware)
    register_error_handlers(app)
    app.include_router(api_router)
    return app
