import json
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.bedrock_service import invoke_model, invoke_model_with_image
from app.services.textract_service import extract_text_from_image
from app.services.sarvam_service import translate_text, text_to_speech
from app.services.s3_service import upload_file, upload_audio_and_get_url
from app.models.schemas import LabQuestionRequest
from app.prompts.lab_analysis import LAB_ANALYSIS_SYSTEM, LAB_ANALYSIS_PROMPT, LAB_QA_SYSTEM, LAB_QA_PROMPT

router = APIRouter(prefix="/lab-samjho", tags=["Lab Samjho"])


@router.post("/analyze")
async def analyze_lab_report(
    image: UploadFile = File(...),
    language: str = Form("hindi"),
    user_id: str = Form("demo-user"),
):
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "application/pdf"]
    if image.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or PDF files are supported.")

    image_bytes = await image.read()

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")

    # Step 1: Extract text using Textract (for additional context)
    try:
        extracted_text = extract_text_from_image(image_bytes)
    except Exception:
        extracted_text = "Could not extract text from image."

    # Step 2: Analyze with AI (vision for images, text-only for PDFs)
    prompt = LAB_ANALYSIS_PROMPT.format(extracted_text=extracted_text)
    is_pdf = image.content_type == "application/pdf"

    try:
        if is_pdf:
            # PDFs: use text-only analysis with Textract output
            raw_response = invoke_model(prompt, system=LAB_ANALYSIS_SYSTEM)
        else:
            # Images: use vision model
            raw_response = invoke_model_with_image(prompt, image_bytes, image.content_type, system=LAB_ANALYSIS_SYSTEM)
        # Parse JSON from response
        json_str = raw_response
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0]
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0]
        result = json.loads(json_str.strip())
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse lab analysis results.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    # Step 3: Translate explanations if not English
    if language != "english":
        for param in result.get("parameters", []):
            try:
                param["explanation_translated"] = await translate_text(
                    param["explanation"], "english", language
                )
            except Exception:
                param["explanation_translated"] = param["explanation"]

        try:
            result["summary"] = await translate_text(result.get("summary", ""), "english", language)
        except Exception:
            pass

    # Step 4: Generate audio summary
    audio_url = None
    try:
        summary_text = result.get("summary", "")
        if summary_text:
            audio_bytes = await text_to_speech(summary_text, language)
            if audio_bytes:
                audio_url = upload_audio_and_get_url(audio_bytes, "lab-audio")
                print(f"[LAB_SAMJHO] Audio generated: {audio_url[:80]}...")
            else:
                print("[LAB_SAMJHO] TTS returned empty audio bytes")
    except Exception as e:
        print(f"[LAB_SAMJHO] TTS/audio error: {type(e).__name__}: {e}")

    interaction_id = str(uuid.uuid4())

    return {
        "parameters": result.get("parameters", []),
        "summary": result.get("summary", ""),
        "audio_url": audio_url,
        "interaction_id": interaction_id,
    }


@router.post("/ask")
async def ask_about_report(request: LabQuestionRequest):
    """Ask a follow-up question about a lab report analysis."""
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Please provide a question.")

    prompt = LAB_QA_PROMPT.format(
        analysis_context=request.analysis_context,
        question=request.question,
    )

    raw = None
    try:
        raw = invoke_model(prompt, system=LAB_QA_SYSTEM)
        json_str = raw
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0]
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0]
        result = json.loads(json_str.strip())
        answer = result.get("answer", raw)
    except (json.JSONDecodeError, Exception):
        answer = raw if isinstance(raw, str) else "I couldn't process your question. Please try again."

    # Translate if needed
    answer_translated = None
    if request.language != "english":
        try:
            answer_translated = await translate_text(answer, "english", request.language)
        except Exception:
            answer_translated = answer

    # Generate audio
    audio_url = None
    try:
        audio_text = answer_translated or answer
        audio_bytes = await text_to_speech(audio_text, request.language)
        if audio_bytes:
            audio_url = upload_audio_and_get_url(audio_bytes, "lab-qa-audio")
    except Exception:
        pass

    return {
        "answer": answer,
        "answer_translated": answer_translated,
        "audio_url": audio_url,
    }
