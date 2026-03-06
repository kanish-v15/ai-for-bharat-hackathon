from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.transcribe_service import speech_to_text

router = APIRouter(prefix="/stt", tags=["STT"])

@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Form("hindi"),
):
    audio_bytes = await audio.read()
    if len(audio_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Audio file too large. Maximum 10MB.")
    try:
        transcript = await speech_to_text(audio_bytes, language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    if not transcript.strip():
        raise HTTPException(status_code=400, detail="Could not understand the audio.")
    return {"transcript": transcript}
