from django.conf import settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.controllers.router import api_router
from app.core.access_log import AccessLogMiddleware
from app.core.error_handlers import register_error_handlers
from app.core.unexpected_error import UnexpectedErrorMiddleware


def create_app() -> FastAPI:
    app = FastAPI(
        title="Passe API",
        description="Player market, clubs, lineups and matches of a fictional football league.",
        version="1.0.0",
        redirect_slashes=False,
        strict_content_type=False,
    )
    # Added first, so innermost: its JSON 500 still passes through CORS.
    app.add_middleware(UnexpectedErrorMiddleware)
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
