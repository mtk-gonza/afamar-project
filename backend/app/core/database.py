import logging

from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
    echo=settings.debug,
)

if "sqlite" in settings.database_url:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


_TYPE_MAP = {
    "INTEGER": "INTEGER",
    "INT": "INTEGER",
    "FLOAT": "REAL",
    "REAL": "REAL",
    "TEXT": "TEXT",
    "VARCHAR": "TEXT",
    "STRING": "TEXT",
    "BOOLEAN": "INTEGER",
    "DATETIME": "TEXT",
    "DATE": "TEXT",
}


def sync_schema() -> None:
    """Add any columns that exist on mapped models but are missing in the DB.

    This is a safety net for DBs whose ``alembic_version`` was stamped past
    the actual schema state.  All model columns are nullable or have a
    server-side default, so existing rows get sensible values.
    """
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            name = table.name
            if name not in existing_tables:
                continue
            db_cols = {c["name"] for c in inspector.get_columns(name)}
            for col in table.columns:
                if col.name in db_cols:
                    continue
                col_type = _TYPE_MAP.get(col.type.__class__.__name__.upper(), "TEXT")
                nullable = "NULL" if col.nullable else "NOT NULL"
                default = ""
                if not col.nullable:
                    if col.type.__class__.__name__.upper() in ("FLOAT", "REAL"):
                        default = " DEFAULT 0"
                    elif col.type.__class__.__name__.upper() in ("INTEGER", "INT", "BOOLEAN"):
                        default = " DEFAULT 0"
                    elif col.type.__class__.__name__.upper() == "STRING":
                        default = " DEFAULT ''"
                sql = f'ALTER TABLE "{name}" ADD COLUMN "{col.name}" {col_type} {nullable}{default}'
                try:
                    conn.execute(text(sql))
                    logger.warning("Schema sync: added missing column %s.%s", name, col.name)
                except Exception:
                    logger.exception("Schema sync failed for %s.%s", name, col.name)
