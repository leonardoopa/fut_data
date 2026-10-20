from typing import Annotated

from pydantic import PlainValidator

from app.domain.exceptions import InvalidInputError, NotFoundError
from app.requests.query import parse_positive_integer

MAX_RESOURCE_ID = 2_147_483_647


def parse_resource_id(raw: object) -> int:
    """A malformed URL id is a 404, not a 400 (V8)."""
    try:
        resource_id = parse_positive_integer(raw)
    except InvalidInputError as error:
        raise NotFoundError from error
    if resource_id > MAX_RESOURCE_ID:
        raise NotFoundError
    return resource_id


ResourceId = Annotated[int, PlainValidator(parse_resource_id, json_schema_input_type=int)]
