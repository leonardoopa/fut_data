class DomainError(Exception):
    """Erro esperado, com mensagem pronta para o cliente."""


class InvalidInputError(DomainError):
    """Dado, formato ou parâmetro inválido."""


class NotFoundError(DomainError):
    """Recurso inexistente."""


class BusinessRuleError(DomainError):
    """Regra de negócio violada pelo estado atual."""
