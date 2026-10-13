from enum import StrEnum


class Position(StrEnum):
    GOL = "GOL"
    ZAG = "ZAG"
    LAT = "LAT"
    MEI = "MEI"
    ATA = "ATA"


class Condition(StrEnum):
    APTO = "APTO"
    MAL_CONDICIONADO = "MAL_CONDICIONADO"
    DOENTE = "DOENTE"


class ContractStatus(StrEnum):
    ATIVO = "ATIVO"
    ENCERRADO = "ENCERRADO"
    RESCINDIDO = "RESCINDIDO"


class TransactionType(StrEnum):
    COMPRA = "COMPRA"
    VENDA = "VENDA"


class Formation(StrEnum):
    THREE_ONE = "3-1"
    TWO_TWO = "2-2"
    TWO_ONE_ONE = "2-1-1"
    ONE_TWO_ONE = "1-2-1"


class DuelAttribute(StrEnum):
    SHOOTING = "shooting"
    PASSING = "passing"
    DRIBBLING = "dribbling"
    DEFENDING = "defending"
