"""
Database configuration for NeuroAdapt FastAPI backend.
Robust multi-environment engine:
- If DATABASE_URL is PostgreSQL and reachable, uses PostgreSQL (e.g. Supabase).
- If DATABASE_URL is placeholder/unconfigured or unreachable, automatically and safely
  falls back to local SQLite database at a stable project path.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load environment variables
load_dotenv()

# Determine consistent root/backend paths
CURRENT_FILE = Path(__file__).resolve()
APP_DIR = CURRENT_FILE.parent            # backend/app
BACKEND_DIR = APP_DIR.parent             # backend
PROJECT_ROOT = BACKEND_DIR.parent if (BACKEND_DIR.parent / "neuroadapt.db").exists() or (BACKEND_DIR.parent / "frontend").exists() else BACKEND_DIR
SQLITE_DB_PATH = PROJECT_ROOT / "neuroadapt.db"
DEFAULT_SQLITE_URL = f"sqlite:///{SQLITE_DB_PATH.as_posix()}"

raw_db_url = os.getenv("DATABASE_URL", "").strip().strip("'\"")

def is_placeholder_db_url(url: str) -> bool:
    if not url:
        return True
    placeholder_tokens = [
        "your-db-password",
        "your-project.supabase.co",
        "placeholder",
        "example.com",
        "user:password",
    ]
    return any(token in url.lower() for token in placeholder_tokens)

def create_resilient_engine():
    target_url = raw_db_url
    if not target_url or is_placeholder_db_url(target_url):
        target_url = DEFAULT_SQLITE_URL

    if target_url.startswith("postgres://"):
        target_url = target_url.replace("postgres://", "postgresql://", 1)

    if "sqlite" in target_url:
        eng = create_engine(
            target_url,
            connect_args={"check_same_thread": False},
            echo=False
        )
        @event.listens_for(eng, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
        return eng, target_url

    # For PostgreSQL, verify connectivity with a quick test
    try:
        pg_engine = create_engine(
            target_url,
            connect_args={"connect_timeout": 3},
            pool_size=10,
            max_overflow=5,
            pool_timeout=5,
            pool_recycle=300,
            pool_pre_ping=True,
            echo=False
        )
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return pg_engine, target_url
    except Exception as e:
        print(f"[NeuroAdapt DB] Notice: PostgreSQL connection unreachable ({e}). Falling back to SQLite: {DEFAULT_SQLITE_URL}")
        eng = create_engine(
            DEFAULT_SQLITE_URL,
            connect_args={"check_same_thread": False},
            echo=False
        )
        @event.listens_for(eng, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
        return eng, DEFAULT_SQLITE_URL

engine, ACTIVE_DATABASE_URL = create_resilient_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
