from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from app.services.polly_service import text_to_speech_smart

router = APIRouter(prefix="/tts", tags=["TTS"])


class TTSRequest(BaseModel):
    text: str
    language: str = "hindi"


@router.post("/speak")
async def speak_text(request: TTSRequest):
    """Convert text to speech. Returns audio bytes directly (MP3 or WAV)."""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
    if len(request.text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long. Maximum 5000 characters.")

    try:
        audio_bytes, content_type = await text_to_speech_smart(request.text, request.language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")

    return Response(content=audio_bytes, media_type=content_type)
