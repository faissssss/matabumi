from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
try:
    from api.routes import router
except ImportError:
    from routes import router

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Include router with /api prefix
app.include_router(router, prefix="/api")
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "matabumi-api"}
