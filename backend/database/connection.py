
"""SQLAlchemy database configuration for INTERVIA."""

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.engine import URL
from sqlalchemy.orm import declarative_base, sessionmaker

# Load backend/.env before reading any database settings.
BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")

# Prefer an explicitly configured DATABASE_URL.
# Otherwise, use Supabase when its password is configured.
database_url = os.getenv("DATABASE_URL")

if not database_url and os.getenv("SUPABASE_DB_PASSWORD"):
    database_url = URL.create(
        drivername="postgresql+psycopg",
        username=os.getenv(
            "SUPABASE_DB_USER",
            "postgres.hezlegoywjnmlkuqkmgm",
        ),
        password=os.environ["SUPABASE_DB_PASSWORD"],
        host=os.getenv(
            "SUPABASE_DB_HOST",
            "aws-0-ap-south-1.pooler.supabase.com",
        ),
        port=int(os.getenv("SUPABASE_DB_PORT", "5432")),
        database=os.getenv("SUPABASE_DB_NAME", "postgres"),
        query={"sslmode": "require"},
    )

# Keep SQLite as the local fallback until Supabase credentials are configured.
if not database_url:
    database_url = "sqlite:///./interview.db"

is_sqlite = str(database_url).startswith("sqlite")

if is_sqlite:
    engine = create_engine(
        database_url,
        connect_args={
            "check_same_thread": False,
            "timeout": 30,
        },
        pool_pre_ping=True,
    )

    @event.listens_for(engine, "connect")
    def _configure_sqlite_connection(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA busy_timeout=30000")
            cursor.execute("PRAGMA synchronous=NORMAL")
        finally:
            cursor.close()

    with engine.connect() as connection:
        connection.exec_driver_sql("PRAGMA journal_mode=WAL")
else:
    engine = create_engine(
        database_url,
        pool_pre_ping=True,
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
