"""SQLAlchemy database configuration for INTERVIA's SQLite development database.

This configuration gives SQLite more time to wait for a concurrent writer and
uses WAL mode to reduce reader/writer blocking. SQLite still permits only one
writer at a time; use PostgreSQL for a production deployment with concurrent
interview sessions.
"""

import os

from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./interview.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={
            "check_same_thread": False,
            "timeout": 30,
        },
        pool_pre_ping=True,
    )

    @event.listens_for(engine, "connect")
    def _configure_sqlite_connection(dbapi_connection, connection_record):
        """Apply safe, per-connection SQLite settings."""
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA busy_timeout=30000")
            cursor.execute("PRAGMA synchronous=NORMAL")
        finally:
            cursor.close()

    # WAL mode is persistent for the database. Set it once as the app imports,
    # before FastAPI begins serving requests. Back up the database first.
    with engine.connect() as connection:
        connection.exec_driver_sql("PRAGMA journal_mode=WAL")
else:
    # Allows DATABASE_URL to point to PostgreSQL (or another SQLAlchemy DB).
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

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
