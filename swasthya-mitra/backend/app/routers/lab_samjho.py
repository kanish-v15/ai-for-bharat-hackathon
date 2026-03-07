import json
import uuid
import io
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.bedrock_service import invoke_model, invoke_model_with_image, invoke_model_with_images
from app.services.textract_service import extract_text_from_image, extract_text_from_pdf, extract_tables_from_image
from app.services.translate_service import translate_text
from app.services.polly_service import text_to_speech_smart
from app.services.comprehend_medical_service import detect_entities as cm_detect_entities
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

    is_pdf = image.content_type == "application/pdf"

    # Step 1: Extract text using Textract
    try:
        if is_pdf:
            # PDFs require async Textract via S3 (sync API only supports images)
            extracted_text = extract_text_from_pdf(image_bytes)
            print(f"[LAB_SAMJHO] PDF text extraction: {len(extracted_text)} chars")
        else:
            extracted_text = extract_text_from_image(image_bytes)
            # Also try table extraction for structured lab data
            try:
                tables = extract_tables_from_image(image_bytes)
                if tables:
                    table_text = "\n\n--- TABLE DATA ---\n"
                    for i, table in enumerate(tables):
                        table_text += f"\nTable {i+1}:\n"
                        for row_idx in sorted(table.keys()):
                            row = table[row_idx]
                            table_text += " | ".join(
                                row.get(c, "") for c in sorted(row.keys())
                            ) + "\n"
                    extracted_text += table_text
                    print(f"[LAB_SAMJHO] Extracted {len(tables)} tables from image")
            except Exception as e:
                print(f"[LAB_SAMJHO] Table extraction failed (non-fatal): {e}")
    except Exception as e:
        print(f"[LAB_SAMJHO] Text extraction error: {e}")
        extracted_text = "Could not extract text from document."

    # Step 2: Analyze with AI
    prompt = LAB_ANALYSIS_PROMPT.format(extracted_text=extracted_text)

    # For images, use vision model; for PDFs, convert all pages to images
    pdf_pages = []  # list of (png_bytes, "image/png") tuples
    pdf_converted = False
    if is_pdf:
        try:
            import fitz  # PyMuPDF — lazy import for Lambda compatibility
            doc = fitz.open(stream=image_bytes, filetype="pdf")
            max_pages = min(len(doc), 10)  # Cap at 10 pages
            for page_num in range(max_pages):
                page = doc[page_num]
                pix = page.get_pixmap(dpi=200)
                pdf_pages.append((pix.tobytes("png"), "image/png"))
            doc.close()
            pdf_converted = True
            print(f"[LAB_SAMJHO] Converted {max_pages} PDF pages to PNG")
        except ImportError:
            print("[LAB_SAMJHO] PyMuPDF not available, using text-only for PDF")
        except Exception as e:
            print(f"[LAB_SAMJHO] PDF conversion failed: {e}")

    try:
        if is_pdf and not pdf_converted:
            # No PyMuPDF — use text-only analysis with Textract async output
            raw_response = invoke_model(prompt, system=LAB_ANALYSIS_SYSTEM)
        elif is_pdf and pdf_converted:
            # Send ALL PDF pages as images for comprehensive analysis
            raw_response = invoke_model_with_images(prompt, pdf_pages, system=LAB_ANALYSIS_SYSTEM)
        else:
            # Single image — use vision model directly
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

    # Step 3: Extract medical entities from OCR text using Comprehend Medical
    medical_entities = []
    try:
        medical_entities = await cm_detect_entities(extracted_text)
        print(f"[LAB_SAMJHO] Comprehend Medical: {len(medical_entities)} entities found")
    except Exception as e:
        print(f"[LAB_SAMJHO] Comprehend Medical error (non-fatal): {e}")

    # Step 4: Translate explanations if not English
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

    # Step 5: Generate audio summary
    audio_url = None
    try:
        summary_text = result.get("summary", "")
        if summary_text:
            audio_bytes, _ = await text_to_speech_smart(summary_text, language)
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
        "medical_entities": medical_entities,
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
        audio_bytes, _ = await text_to_speech_smart(audio_text, request.language)
        if audio_bytes:
            audio_url = upload_audio_and_get_url(audio_bytes, "lab-qa-audio")
    except Exception:
        pass

    return {
        "answer": answer,
        "answer_translated": answer_translated,
        "audio_url": audio_url,
    }
