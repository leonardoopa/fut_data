"""Catalog of the API errors; the base class sets the status: 400, 404 or 409 (V9).

Check order: request format (400), resource existence (404), rules that depend on
the current time (400), then business rules over the current state (409).
"""

from decimal import Decimal

from app.domain.money import format_money


class DomainError(Exception):
    message = "Não foi possível concluir a operação."

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.message)


class InvalidInputError(DomainError, ValueError):
    """Also a ValueError, so Pydantic reports it as a field error (400)."""

    message = "Dado inválido."


class NotFoundError(DomainError):
    message = "Recurso não encontrado."


class BusinessRuleError(DomainError):
    """Business rule violated by the current state (409)."""


class PlayerNotFoundError(NotFoundError):
    message = "Jogador não encontrado."


class ClubNotFoundError(NotFoundError):
    message = "Clube não encontrado."


class AgilityAboveCapError(InvalidInputError):
    def __init__(self, cap_age: int, cap: int) -> None:
        super().__init__(
            f"Com {cap_age} anos ou mais, a agilidade (agility) deve ser no máximo {cap}."
        )


class AttributesTotalTooHighError(InvalidInputError):
    def __init__(self, maximum: int) -> None:
        super().__init__(
            f"A soma dos seis atributos técnicos não pode passar de {maximum}."
        )


class PotentialBelowHighestAttributeError(InvalidInputError):
    def __init__(self, highest: int) -> None:
        super().__init__(
            "O potencial (potential) deve ser maior ou igual ao maior dos seis atributos "
            f"({highest})."
        )


class PotentialNotAtPeakError(InvalidInputError):
    def __init__(self, peak_age: int, highest: int) -> None:
        super().__init__(
            f"No cadastro com {peak_age} anos ou mais, o potencial (potential) deve ser "
            f"igual ao maior dos seis atributos ({highest})."
        )


class AgeRangeInvertedError(InvalidInputError):
    message = "A idade mínima (min_age) não pode ser maior que a máxima (max_age)."


class ValueRangeInvertedError(InvalidInputError):
    message = "O valor mínimo (min_value) não pode ser maior que o máximo (max_value)."


class FreeWithClubFilterError(InvalidInputError):
    message = (
        "free=true não pode ser combinado com club_id: jogador livre não tem clube."
    )


class AcronymMismatchError(InvalidInputError):
    message = (
        "A sigla (acronym) deve começar pela primeira letra do nome e ter as outras duas "
        "letras na ordem em que aparecem no nome."
    )


class LoyaltyNotInFutureError(InvalidInputError):
    message = (
        "O fim da fidelidade (loyalty_until) deve ser posterior ao momento da compra."
    )


class LoyaltyTooLongError(InvalidInputError):
    def __init__(self, max_days: int) -> None:
        super().__init__(
            f"O fim da fidelidade (loyalty_until) pode ser no máximo {max_days} dias "
            "depois do momento da compra."
        )


class PositionLockedError(BusinessRuleError):
    message = "Jogador com clube não pode mudar de posição."


class AgeDecreaseError(BusinessRuleError):
    def __init__(self, current_age: int) -> None:
        super().__init__(
            f"A idade não pode ser menor que a atual ({current_age} anos)."
        )


class SickToFitError(BusinessRuleError):
    message = "Jogador DOENTE não pode passar direto para APTO; altere antes para MAL_CONDICIONADO."


class PlayerInClubDeletionError(BusinessRuleError):
    message = (
        "Só jogador livre pode ser excluído; este jogador está no elenco de um clube."
    )


class ClubNameTakenError(BusinessRuleError):
    message = "Já existe um clube com este nome."


class ClubAcronymTakenError(BusinessRuleError):
    message = "Já existe um clube com esta sigla."


class ClubAlreadyRegisteredError(BusinessRuleError):
    message = "Já existe um clube com este nome ou esta sigla."


class LeagueFullError(BusinessRuleError):
    def __init__(self, max_clubs: int) -> None:
        super().__init__(f"A liga já tem o máximo de {max_clubs} clubes.")


class PlayerNotFreeError(BusinessRuleError):
    message = "O jogador não está livre: já pertence a um clube."


class RepurchaseError(BusinessRuleError):
    message = "O clube não pode comprar um jogador que ele mesmo já vendeu."


class SquadFullError(BusinessRuleError):
    def __init__(self, max_squad_size: int) -> None:
        super().__init__(f"O elenco já tem o máximo de {max_squad_size} jogadores.")


class CashLimitExceededError(BusinessRuleError):
    def __init__(self, total_cost: Decimal, cash: Decimal) -> None:
        super().__init__(
            f"O custo total ({format_money(total_cost)}) passa de 50% do caixa "
            f"do clube ({format_money(cash)})."
        )


class FreePlayerSaleError(BusinessRuleError):
    message = "Jogador livre não pode ser vendido."


class MatchNotFoundError(NotFoundError):
    message = "Partida não encontrada."


class RepeatedStartersError(InvalidInputError):
    message = (
        "Os ids de player_ids devem ser distintos: um jogador não entra duas vezes."
    )


class SameClubMatchError(InvalidInputError):
    message = "O mandante (home_club_id) e o visitante (away_club_id) devem ser clubes diferentes."


class StarterNotInSquadError(BusinessRuleError):
    message = "Só jogadores do elenco do clube podem ser escalados."


class SickStarterError(BusinessRuleError):
    message = "Jogador DOENTE não pode ser escalado."


class FormationMismatchError(BusinessRuleError):
    def __init__(self, formation: str) -> None:
        super().__init__(
            f"As posições dos titulares não fecham a formação {formation}: são 1 goleiro (GOL) "
            "e, em cada setor, a quantidade de jogadores da formação."
        )


class IncompleteLineupError(BusinessRuleError):
    def __init__(self, club_name: str, lineup_size: int) -> None:
        super().__init__(
            f"O clube {club_name} não tem a escalação completa com {lineup_size} titulares."
        )
