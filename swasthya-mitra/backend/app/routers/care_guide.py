import json
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.models.schemas import CareGuideTextRequest
from app.services.bedrock_service import invoke_claude
from app.services.sarvam_service import speech_to_text, text_to_speech, translate_text
from app.services.s3_service import upload_audio_and_get_url
from app.prompts.medical_qa import CARE_GUIDE_SYSTEM, CARE_GUIDE_PROMPT, EMERGENCY_KEYWORDS

router = APIRouter(prefix="/care-guide", tags=["Care Guide"])

# In-memory session store (use DynamoDB in production)
sessions: dict[str, list[dict]] = {}


def check_emergency(text: str) -> bool:
    text_lower = text.lower()
    return any(kw in text_lower for kw in EMERGENCY_KEYWORDS)


async def process_question(question: str, language: str, session_id: str | None) -> dict:
    # Get or create session
    if not session_id:
        session_id = str(uuid.uuid4())
    if session_id not in sessions:
        sessions[session_id] = []

    # Build conversation history
    history = ""
    for msg in sessions[session_id][-6:]:  # Last 3 exchanges
        history += f"{msg['role']}: {msg['text']}\n"

    # Check for emergency keywords
    is_emergency = check_emergency(question)

    # Translate to English if needed (for better AI reasoning)
    question_en = question
    if language != "english":
        try:
            question_en = await translate_text(question, language, "english")
        except Exception:
            pass

    # Get AI response
    prompt = CARE_GUIDE_PROMPT.format(
        question=question_en,
        conversation_history=history,
    )

    try:
        raw = invoke_claude(prompt, system=CARE_GUIDE_SYSTEM)
        # Parse JSON
        json_str = raw
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0]
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0]
        result = json.loads(json_str.strip())
        answer = result.get("answer", raw)
        is_emergency = is_emergency or result.get("is_emergency", False)
    except (json.JSONDecodeError, Exception):
        answer = raw if isinstance(raw, str) else "I'm sorry, I couldn't process your question. Please try again."

    # Translate answer if not English
    answer_translated = None
    if language != "english":
        try:
            answer_translated = await translate_text(answer, "english", language)
        except Exception:
            answer_translated = answer

    # Generate audio
    audio_url = None
    try:
        audio_text = answer_translated or answer
        audio_bytes = await text_to_speech(audio_text, language)
        if audio_bytes:
            audio_url = upload_audio_and_get_url(audio_bytes, "care-audio")
    except Exception:
        pass

    # Save to session
    sessions[session_id].append({"role": "user", "text": question_en})
    sessions[session_id].append({"role": "assistant", "text": answer})

    return {
        "answer": answer,
        "answer_translated": answer_translated,
        "audio_url": audio_url,
        "is_emergency": is_emergency,
        "session_id": session_id,
    }


@router.post("/ask")
async def ask_voice(
    audio: UploadFile = File(...),
    language: str = Form("hindi"),
    user_id: str = Form("demo-user"),
    session_id: str = Form(None),
):
    audio_bytes = await audio.read()

    # Step 1: Speech to text
    try:
        transcription = await speech_to_text(audio_bytes, language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not transcribe audio: {str(e)}")

    if not transcription.strip():
        raise HTTPException(status_code=400, detail="Could not understand the audio. Please try again.")

    # Step 2: Process question
    result = await process_question(transcription, language, session_id)
    result["transcription"] = transcription
    return result


@router.post("/ask-text")
async def ask_text(request: CareGuideTextRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Please provide a question.")

    result = await process_question(request.text, request.language, request.session_id)
    return result
