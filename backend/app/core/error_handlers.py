import logging
from collections.abc import Awaitable, Callable
from http import HTTPStatus

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

ErrorHandler = Callable[[Request, DomainError], Awaitable[JSONResponse]]


def error_response(status: int, message: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"message": message})


def describe_validation_error(error: RequestValidationError) -> str:
    first = error.errors()[0]
    field = ".".join(
        str(part) for part in first["loc"] if part not in {"body", "query", "path"}
    )
    if first["type"] == "json_invalid":
        return "O corpo da requisição não é um JSON válido."
    if first["type"] == "missing":
        return f"Campo obrigatório ausente: {field or 'corpo da requisição'}."
    if not field:
        return "O corpo da requisição deve ser um objeto JSON."
    return f"Valor inválido para o campo {field}."


def domain_error_handler(status: HTTPStatus) -> ErrorHandler:
    async def handle(_: Request, error: DomainError) -> JSONResponse:
        return error_response(status, str(error))

    return handle


async def handle_validation_error(
    _: Request, error: RequestValidationError
) -> JSONResponse:
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
