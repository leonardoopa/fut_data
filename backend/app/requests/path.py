from typing import Annotated

from pydantic import PlainValidator

from app.domain.exceptions import InvalidInputError, NotFoundError
from app.requests.query import parse_positive_integer

MAX_RESOURCE_ID = 2_147_483_647
RESOURCE_NOT_FOUND = "Recurso não encontrado."


def parse_resource_id(raw: object) -> int:
    """Id da URL fora do formato conta como recurso inexistente (V8): 404, não 400.

    O NotFoundError não é um ValueError, então o Pydantic o deixa propagar até o
    tratador de erros, que responde 404.
    """
    try:
        resource_id = parse_positive_integer(raw)
    except InvalidInputError as error:
        raise NotFoundError(RESOURCE_NOT_FOUND) from error
    if resource_id > MAX_RESOURCE_ID:
        raise NotFoundError(RESOURCE_NOT_FOUND)
    return resource_id


ResourceId = Annotated[int, PlainValidator(parse_resource_id, json_schema_input_type=int)]
