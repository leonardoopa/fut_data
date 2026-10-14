"""Corpo e query params dos endpoints de clubes."""

from typing import Self

from pydantic import BaseModel, model_validator

from app.domain.club import ClubRegistration, validate_acronym_for_name
from app.domain.club_listing import ClubListCriteria, ClubSort
from app.requests.fields import Acronym, ClubName


class ClubRegistrationRequest(BaseModel):
    """Corpo de POST /clubs; o caixa não é enviado (V7)."""

    name: ClubName
    acronym: Acronym

    @model_validator(mode="after")
    def check_acronym_matches_name(self) -> Self:
        validate_acronym_for_name(self.acronym, self.name)
        return self

    def to_registration(self) -> ClubRegistration:
        return ClubRegistration(name=self.name, acronym=self.acronym)


class ClubListQuery(BaseModel):
    """Query params de GET /clubs; sem sort, a ordem é pelo nome."""

    sort: ClubSort | None = None

    def to_criteria(self) -> ClubListCriteria:
        return ClubListCriteria(**self.model_dump(exclude_none=True))
