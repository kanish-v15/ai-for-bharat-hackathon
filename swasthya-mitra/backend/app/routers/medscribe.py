import json
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.models.schemas import MedScribeTextRequest
from app.services.bedrock_service import invoke_model
from app.services.sarvam_service import speech_to_text, text_to_speech, translate_text
from app.services.s3_service import upload_audio_and_get_url
from app.prompts.soap_notes import MEDSCRIBE_SYSTEM, MEDSCRIBE_PROMPT

router = APIRouter(prefix="/medscribe", tags=["MedScribe"])


@router.post("/process")
async def process_consultation(
    audio: UploadFile = File(...),
    language: str = Form("hindi"),
    doctor_id: str = Form("demo-doctor"),
    patient_id: str = Form(None),
):
    audio_bytes = await audio.read()

    if len(audio_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Audio file too large. Maximum 25MB.")

    # Step 1: Transcribe audio
    try:
        transcription = await speech_to_text(audio_bytes, language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not transcribe audio: {str(e)}")

    if not transcription.strip():
        raise HTTPException(status_code=400, detail="Could not understand the audio. Please try speaking more clearly.")

    # Step 2: Translate to English for SOAP note generation
    transcription_en = transcription
    if language != "english":
        try:
            transcription_en = await translate_text(transcription, language, "english")
        except Exception:
            pass

    # Step 3: Generate SOAP notes with Claude
    prompt = MEDSCRIBE_PROMPT.format(transcription=transcription_en)

    try:
        raw = invoke_model(prompt, system=MEDSCRIBE_SYSTEM)
        json_str = raw
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0]
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0]
        result = json.loads(json_str.strip())
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to generate SOAP notes from transcription.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

    # Step 4: Translate patient instructions if not English
    patient_instructions = result.get("patient_instructions", "")
    patient_instructions_translated = None
    if language != "english" and patient_instructions:
        try:
            patient_instructions_translated = await translate_text(
                patient_instructions, "english", language
            )
        except Exception:
            patient_instructions_translated = patient_instructions

    # Step 5: Generate audio for patient instructions
    patient_audio_url = None
    try:
        audio_text = patient_instructions_translated or patient_instructions
        if audio_text:
            audio_bytes_out = await text_to_speech(audio_text, language)
            if audio_bytes_out:
                patient_audio_url = upload_audio_and_get_url(audio_bytes_out, "medscribe-audio")
    except Exception:
        pass

    interaction_id = str(uuid.uuid4())

    return {
        "transcription": transcription,
        "soap_note": result.get("soap_note", {}),
        "medications": result.get("medications", []),
        "patient_instructions": patient_instructions,
        "patient_instructions_translated": patient_instructions_translated,
        "patient_audio_url": patient_audio_url,
        "interaction_id": interaction_id,
        "patient_id": patient_id,
    }


async def _process_transcription(transcription: str, language: str) -> dict:
    """Shared logic: takes transcription text, generates SOAP notes + translations + audio."""
    # Translate to English for SOAP note generation
    transcription_en = transcription
    if language != "english":
        try:
            transcription_en = await translate_text(transcription, language, "english")
        except Exception:
            pass

    # Generate SOAP notes with Claude
    prompt = MEDSCRIBE_PROMPT.format(transcription=transcription_en)

    try:
        raw = invoke_model(prompt, system=MEDSCRIBE_SYSTEM)
        json_str = raw
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0]
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0]
        result = json.loads(json_str.strip())
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to generate SOAP notes from transcription.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

    # Translate patient instructions if not English
    patient_instructions = result.get("patient_instructions", "")
    patient_instructions_translated = None
    if language != "english" and patient_instructions:
        try:
            patient_instructions_translated = await translate_text(
                patient_instructions, "english", language
            )
        except Exception:
            patient_instructions_translated = patient_instructions

    # Generate audio for patient instructions
    patient_audio_url = None
    try:
        audio_text = patient_instructions_translated or patient_instructions
        if audio_text:
            audio_bytes_out = await text_to_speech(audio_text, language)
            if audio_bytes_out:
                patient_audio_url = upload_audio_and_get_url(audio_bytes_out, "medscribe-audio")
    except Exception:
        pass

    interaction_id = str(uuid.uuid4())

    return {
        "transcription": transcription,
        "soap_note": result.get("soap_note", {}),
        "medications": result.get("medications", []),
        "patient_instructions": patient_instructions,
        "patient_instructions_translated": patient_instructions_translated,
        "patient_audio_url": patient_audio_url,
        "interaction_id": interaction_id,
    }


@router.post("/process-text")
async def process_consultation_text(request: MedScribeTextRequest):
    """Process consultation from transcribed text (Web Speech API frontend)."""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Please provide consultation text.")

    result = await _process_transcription(request.text, request.language)
    result["patient_id"] = request.patient_id
    return result
