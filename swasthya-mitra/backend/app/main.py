import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from app.routers import lab_samjho, care_guide, medscribe, stt, tts, history, users, auth
from app.services.cloudwatch_service import api_logger

app = FastAPI(
    title="SwasthyaMitra API",
    description="Voice-first multilingual AI healthcare assistant",
    version="2.0.0",
)

# CORS - allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all API requests with structured CloudWatch-compatible logging."""
    start = time.time()
    response = await call_next(request)
    latency_ms = (time.time() - start) * 1000

    api_logger.info(
        f"{request.method} {request.url.path}",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        latency_ms=round(latency_ms, 1),
        client=request.client.host if request.client else "unknown",
    )
    return response


# Register routers
app.include_router(auth.router, prefix="/api")
app.include_router(lab_samjho.router, prefix="/api")
app.include_router(care_guide.router, prefix="/api")
app.include_router(medscribe.router, prefix="/api")
app.include_router(stt.router, prefix="/api")
app.include_router(tts.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(users.router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SwasthyaMitra",
        "version": "2.0.0",
        "services": {
            "tts": "Amazon Polly + Sarvam Bulbul",
            "stt": "Amazon Transcribe + Transcribe Medical",
            "translate": "Amazon Translate",
            "nlp": "Amazon Comprehend Medical",
            "llm": "Amazon Bedrock (Nova Lite)",
            "ocr": "Amazon Textract",
            "storage": "Amazon S3 + DynamoDB",
            "auth": "Amazon Cognito",
        },
    }


# Lambda handler via Mangum
handler = Mangum(app, lifespan="off")
