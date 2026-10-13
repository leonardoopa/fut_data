from alembic import context
from sqlalchemy import create_engine

from app.core.config import get_settings
from app.models import Base


def run_migrations() -> None:
    engine = create_engine(get_settings().database_url)
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=Base.metadata,
            compare_type=True,
            render_as_batch=connection.dialect.name == "sqlite",
        )
        with context.begin_transaction():
            context.run_migrations()


run_migrations()
