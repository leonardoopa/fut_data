import logging
from http import HTTPStatus

from starlette.types import ASGIApp, Message, Receive, Scope, Send

logger = logging.getLogger("app.access")


class AccessLogMiddleware:
    """Registra método, caminho e status de cada requisição HTTP."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        status = HTTPStatus.INTERNAL_SERVER_ERROR.value

        async def send_with_status(message: Message) -> None:
            nonlocal status
            if message["type"] == "http.response.start":
                status = message["status"]
            await send(message)

        try:
            await self.app(scope, receive, send_with_status)
        finally:
            logger.info("%s %s %s", scope["method"], scope["path"], status)
