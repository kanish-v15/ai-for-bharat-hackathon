from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from app.routers import lab_samjho, care_guide, medscribe

app = FastAPI(
    title="SwasthyaMitra API",
    description="Voice-first multilingual AI healthcare assistant",
    version="1.0.0",
)

# CORS - allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(lab_samjho.router, prefix="/api")
app.include_router(care_guide.router, prefix="/api")
app.include_router(medscribe.router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "SwasthyaMitra"}


# Lambda handler via Mangum
handler = Mangum(app, lifespan="off")
