class DomainError(Exception):
    """Erro esperado, com mensagem pronta para o cliente."""


class InvalidInputError(DomainError, ValueError):
    """Dado, formato ou parâmetro inválido.

    Também é um ValueError para que o Pydantic o converta em erro de validação
    do campo quando é lançado dentro de um validador.
    """


class NotFoundError(DomainError):
    """Recurso inexistente."""


class BusinessRuleError(DomainError):
    """Regra de negócio violada pelo estado atual."""
