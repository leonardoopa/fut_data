from app.core.database import DatabaseRouter, check_database_connection

router = DatabaseRouter(tags=["Saúde"])


@router.get("/health", summary="Verifica se a API e o banco de dados estão no ar")
def health() -> dict[str, str]:
    check_database_connection()
    return {"status": "ok"}
