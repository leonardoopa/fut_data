from fastapi import APIRouter

from app.controllers import health_controller

API_PREFIX = "/api/v1"

api_router = APIRouter(prefix=API_PREFIX)
api_router.include_router(health_controller.router)
