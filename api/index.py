from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

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

# Include router WITH /api prefix to match Vercel routing
app.include_router(router, prefix="/api")

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "matabumi-api"}

# Mangum handler for Vercel
handler = Mangum(app, lifespan="off")
