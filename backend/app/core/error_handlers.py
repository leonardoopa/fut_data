import logging
from collections.abc import Awaitable, Callable
from http import HTTPStatus
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.domain.exceptions import (
    BusinessRuleError,
    DomainError,
    InvalidInputError,
    NotFoundError,
)

logger = logging.getLogger(__name__)

DOMAIN_ERROR_STATUS: dict[type[DomainError], HTTPStatus] = {
    InvalidInputError: HTTPStatus.BAD_REQUEST,
    NotFoundError: HTTPStatus.NOT_FOUND,
    BusinessRuleError: HTTPStatus.CONFLICT,
}

HTTP_ERROR_MESSAGES: dict[int, str] = {
    HTTPStatus.NOT_FOUND: "Recurso não encontrado.",
    HTTPStatus.METHOD_NOT_ALLOWED: "Método não permitido neste caminho.",
}

UNEXPECTED_ERROR_MESSAGE = "Erro interno inesperado. A operação foi desfeita."

REQUEST_LOCATIONS = frozenset({"body", "query", "path"})
INVALID_JSON_MESSAGE = "O corpo da requisição não é um JSON válido."
MISSING_BODY_MESSAGE = "O corpo da requisição é obrigatório."
BODY_NOT_OBJECT_MESSAGE = "O corpo da requisição deve ser um objeto JSON."
FIELD_REASONS: dict[str, str] = {
    "missing": "é obrigatório.",
    "enum": "valor fora da lista aceita.",
    "greater_than_equal": "deve ser maior ou igual a {ge}.",
    "less_than_equal": "deve ser menor ou igual a {le}.",
    "too_short": "deve ter pelo menos {min_length} itens.",
    "too_long": "deve ter no máximo {max_length} itens.",
}
DEFAULT_FIELD_REASON = "valor inválido."

ErrorHandler = Callable[[Request, DomainError], Awaitable[JSONResponse]]
ValidationDetail = dict[str, Any]


def error_response(status: int, message: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"message": message})


def describe_field_reason(detail: ValidationDetail) -> str:
    context = detail.get("ctx", {})
    if detail["type"] == "value_error":
        return str(context["error"])
    return FIELD_REASONS.get(detail["type"], DEFAULT_FIELD_REASON).format(**context)


def describe_validation_error(error: RequestValidationError) -> str:
    """Traduz o primeiro erro de validação do Pydantic numa mensagem para o cliente."""
    detail = error.errors()[0]
    if detail["type"] == "json_invalid":
        return INVALID_JSON_MESSAGE
    field = ".".join(str(part) for part in detail["loc"] if part not in REQUEST_LOCATIONS)
    if field:
        return f"Campo {field}: {describe_field_reason(detail)}"
    if detail["type"] == "value_error":
        return describe_field_reason(detail)
    if detail["type"] == "missing":
        return MISSING_BODY_MESSAGE
    return BODY_NOT_OBJECT_MESSAGE


def domain_error_handler(status: HTTPStatus) -> ErrorHandler:
    async def handle(_: Request, error: DomainError) -> JSONResponse:
        return error_response(status, str(error))

    return handle


async def handle_validation_error(_: Request, error: RequestValidationError) -> JSONResponse:
    return error_response(HTTPStatus.BAD_REQUEST, describe_validation_error(error))


async def handle_http_error(_: Request, error: StarletteHTTPException) -> JSONResponse:
    message = HTTP_ERROR_MESSAGES.get(error.status_code, str(error.detail))
    return error_response(error.status_code, message)


async def handle_unexpected_error(_: Request, error: Exception) -> JSONResponse:
    logger.exception("Falha inesperada", exc_info=error)
    return error_response(HTTPStatus.INTERNAL_SERVER_ERROR, UNEXPECTED_ERROR_MESSAGE)


def register_error_handlers(app: FastAPI) -> None:
    for error_type, status in DOMAIN_ERROR_STATUS.items():
        app.add_exception_handler(error_type, domain_error_handler(status))
    app.add_exception_handler(RequestValidationError, handle_validation_error)
    app.add_exception_handler(StarletteHTTPException, handle_http_error)
    app.add_exception_handler(Exception, handle_unexpected_error)
