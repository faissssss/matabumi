"""
FastAPI application entrypoint for the MataBumi backend.
"""

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.api.routes import router

PROJECT_ROOT = Path(__file__).resolve().parents[2]
THUMBNAIL_DIR = PROJECT_ROOT / "outputs" / "thumbnails"
THUMBNAIL_DIR.mkdir(parents=True, exist_ok=True)

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

production_origin = os.getenv("FRONTEND_ORIGIN")
if production_origin:
    allowed_origins.append(production_origin)

app = FastAPI(
    title="MataBumi Deforestation API",
    version="0.1.0",
    description="REST API for Indonesian deforestation alerts and dashboard summaries.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(router)
app.mount("/api/thumbnails", StaticFiles(directory=THUMBNAIL_DIR), name="thumbnails")


@app.get("/")
def root() -> dict:
    return {
        "service": "MataBumi Deforestation API",
        "version": app.version,
        "docs": "/docs",
    }
