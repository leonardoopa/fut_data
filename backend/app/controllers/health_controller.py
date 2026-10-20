from app.core.database import DatabaseRouter, check_database_connection

router = DatabaseRouter(tags=["Health"])


@router.get("/health", summary="Check that the API and the database are up")
def health() -> dict[str, str]:
    check_database_connection()
    return {"status": "ok"}
