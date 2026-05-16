"""
Vercel Serverless Function entry point for MataBumi API.
This file adapts the FastAPI app to work with Vercel's serverless environment.
"""

# Initialize database FIRST (before any other imports)
import sys
import os

# Add parent directory to path so we can import backend modules
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Initialize database for Vercel environment
from api._db_init import init_database
init_database()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

# Import routes from backend
from backend.api.routes import router

# Create FastAPI app
app = FastAPI(
    title="MataBumi Deforestation API",
    version="0.1.0",
    description="REST API for Indonesian deforestation alerts and dashboard summaries.",
)

# Configure CORS for Vercel deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://matabumi.vercel.app",
        "https://*.vercel.app",  # Allow all Vercel preview deployments
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)

# Root endpoint
@app.get("/")
def root():
    return {
        "service": "MataBumi Deforestation API",
        "version": "0.1.0",
        "docs": "/api/docs",
        "status": "running on Vercel"
    }

# Mangum handler for Vercel
handler = Mangum(app, lifespan="off")
