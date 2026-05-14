"""
Database initialization entrypoint for MataBumi.

The canonical SQLite database lives in backend/database/matabumi.db so the
FastAPI app can serve it directly. This script exists in database/ to match
the implementation plan and delegates to the backend database initializer.
"""

import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(PROJECT_ROOT)

from backend.database.init_db import init_database


if __name__ == "__main__":
    init_database()
