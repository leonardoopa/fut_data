from fastapi import APIRouter

router = APIRouter(tags=["Saúde"])


@router.get("/health", summary="Verifica se a API está no ar")
def health() -> dict[str, str]:
    return {"status": "ok"}
