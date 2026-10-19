from starlette.requests import Request
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.error_handlers import handle_unexpected_error


class UnexpectedErrorMiddleware:
    """Responde a falha inesperada por dentro do CORS.

    O tratador de `Exception` do Starlette roda fora de todos os middlewares, e o 500 sairia sem
    os cabeçalhos do CORS: o navegador mostraria erro de CORS em vez do `message`.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        response_started = False

        async def send_tracking_start(message: Message) -> None:
            nonlocal response_started
            if message["type"] == "http.response.start":
                response_started = True
            await send(message)

        try:
            await self.app(scope, receive, send_tracking_start)
        except Exception as error:
            if response_started:
                raise
            response = await handle_unexpected_error(Request(scope), error)
            await response(scope, receive, send)
