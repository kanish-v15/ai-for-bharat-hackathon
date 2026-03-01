# Lab Samjho - Implementation Guide (Saravana)

## Owner: Saravana Rajan (Team Leader)
## Branch: `saravana/lab-samjho`
## Estimated Time: 20-24 hours across 5 days

---

## Feature Summary

Lab Samjho lets patients upload a photo of their lab report and receive:
1. Extracted text from the image (OCR)
2. Each parameter classified as Normal / Borderline / Abnormal
3. A plain-language summary in Hindi or Tamil
4. An audio explanation they can listen to

**Flow:**
```
Photo Upload → S3 → Textract (OCR) → Bedrock Sonnet 4.6 (Analysis)
→ Sarvam Mayura (Translate) → Sarvam Bulbul (TTS) → Audio Response
```

---

## Day-by-Day Tasks

### Day 1 (4 hrs): Backend Core

**Task 1.1: Textract Integration (2 hrs)**
- File: `backend/app/services/textract_service.py`
- Implement `extract_text_from_image(image_bytes)`
- Use `analyze_document` with `FeatureTypes=['TABLES', 'FORMS']` for structured lab data
- Parse Textract response to extract:
  - Raw text blocks
  - Table data (parameter name, value, reference range columns)
  - Confidence scores per block
- Handle edge cases: rotated images, poor quality (confidence < 0.8)
- Test with a sample lab report image

**Task 1.2: Bedrock Lab Analysis Prompt (2 hrs)**
- File: `backend/app/prompts/lab_analysis.py`
- Write the system prompt for Claude Sonnet 4.6:

```python
LAB_ANALYSIS_SYSTEM_PROMPT = """You are a medical AI assistant specialized in interpreting lab reports.
Analyze the following extracted lab report text and for each parameter:

1. Identify the parameter name
2. Extract the patient's value and unit
3. Identify the reference range
4. Classify as: Normal (within range), Borderline (within 10% of range limits), or Abnormal (outside range)
5. Write a brief explanation in simple language that a non-medical person can understand

Output as JSON:
{
  "parameters": [
    {
      "name": "Hemoglobin",
      "value": "12.5",
      "unit": "g/dL",
      "reference_range": "12.0-16.0",
      "classification": "Normal",
      "explanation": "Your hemoglobin level is within the healthy range."
    }
  ],
  "overall_summary": "A brief 2-3 sentence summary of the overall report",
  "attention_needed": ["List of parameters that need doctor attention"],
  "disclaimer": "This analysis is for informational purposes only. Please consult your doctor for medical advice."
}

IMPORTANT:
- Be conservative in classifications. When in doubt, classify as Borderline.
- Always include the disclaimer.
- If a parameter cannot be identified or has no reference range, mark it as "Unclassified".
- Keep explanations simple - assume the reader has no medical knowledge.
"""
```

- File: `backend/app/services/bedrock_service.py`
- Implement `analyze_lab_report(extracted_text, language)`:
  - Sends extracted text + system prompt to Bedrock Sonnet 4.6
  - Parses JSON response
  - Returns structured analysis

### Day 2 (5 hrs): Complete Backend + Translation + Audio

**Task 2.1: Lab Samjho Router (1.5 hrs)**
- File: `backend/app/routers/lab_samjho.py`
- Implement `POST /api/lab-samjho/analyze`:

```python
# Endpoint flow:
# 1. Receive image (multipart form data) + language preference
# 2. Upload image to S3 (lab-reports/{user_id}/{interaction_id}/)
# 3. Call Textract to extract text
# 4. Check extraction confidence, return error if too low
# 5. Call Bedrock to analyze parameters
# 6. Call Sarvam Mayura to translate summary to Hindi/Tamil
# 7. Call Sarvam Bulbul to generate audio
# 8. Upload audio to S3
# 9. Save interaction to DynamoDB
# 10. Return: {parameters, summary, audio_url, interaction_id}
```

**Task 2.2: Translation + Audio Pipeline (1.5 hrs)**
- Use `sarvam_service.translate(summary, "en", target_lang)` for translation
- Use `sarvam_service.text_to_speech(translated_summary, language_code)` for audio
- Upload audio to S3, get signed URL
- Store everything in DynamoDB

**Task 2.3: Error Handling (1 hr)**
- Handle: invalid image format (not JPEG/PNG/PDF)
- Handle: image too large (>10MB)
- Handle: Textract low confidence (<0.8) → return friendly error in native language
- Handle: Bedrock timeout → retry once, then return generic error
- Handle: Sarvam API failure → return text-only results (no audio)

**Task 2.4: Test End-to-End (1 hr)**
- Test with a real lab report image
- Verify: upload → OCR → analysis → translation → audio
- Check parameter classifications are reasonable
- Verify audio plays correctly

### Day 3 (5 hrs): Frontend UI

**Task 3.1: Lab Samjho Page Layout (1.5 hrs)**
- File: `frontend/src/pages/LabSamjho.jsx`
- Layout:
  ```
  ┌──────────────────────────────┐
  │  📋 Lab Samjho              │
  │  "Understand your lab report"│
  ├──────────────────────────────┤
  │                              │
  │  ┌────────────────────────┐  │
  │  │    📷 Upload Report    │  │
  │  │   Tap to take photo    │  │
  │  │   or choose from gallery│  │
  │  └────────────────────────┘  │
  │                              │
  │  [Upload Button - Large]     │
  │                              │
  ├──────────────────────────────┤
  │  Results (shown after upload)│
  │                              │
  │  🟢 Hemoglobin: 12.5 g/dL  │
  │     Normal (12.0-16.0)      │
  │                              │
  │  🔴 Blood Sugar: 200 mg/dL │
  │     Abnormal (70-100)       │
  │                              │
  │  🟡 Cholesterol: 195 mg/dL │
  │     Borderline (0-200)      │
  │                              │
  ├──────────────────────────────┤
  │  📝 Summary                 │
  │  "Your report shows..."     │
  │                              │
  │  🔊 [Listen to Explanation] │
  │                              │
  │  ⚠️ Disclaimer             │
  └──────────────────────────────┘
  ```

**Task 3.2: Image Upload Component (1.5 hrs)**
- Support camera capture (mobile) and file picker
- Accept: JPEG, PNG, PDF
- Show image preview after selection
- Compress image if >5MB before upload
- Large, accessible upload button (full-width, 60px height)

**Task 3.3: Results Display (1.5 hrs)**
- Color-coded parameter cards:
  - 🟢 Green = Normal
  - 🟡 Yellow = Borderline
  - 🔴 Red = Abnormal
  - ⚪ Gray = Unclassified
- Each card shows: parameter name, value, range, explanation
- Summary section at bottom
- AudioPlayer component for listening
- Disclaimer banner at the very bottom

**Task 3.4: Loading States (0.5 hrs)**
- Step-by-step progress:
  1. "Uploading report..." (with progress bar)
  2. "Reading your report..." (Textract)
  3. "Analyzing parameters..." (Bedrock)
  4. "Translating to Hindi..." (Sarvam)
  5. "Generating audio..." (Sarvam TTS)
- Each step shows a checkmark when complete

### Day 4 (4 hrs): Integration + Polish

**Task 4.1: Connect Frontend to Backend (1.5 hrs)**
- Wire up API calls in `frontend/src/services/api.js`
- Handle loading, success, and error states
- Test complete flow: upload → see results → play audio

**Task 4.2: Test with Multiple Lab Reports (1 hr)**
- Test with at least 3 different lab report formats:
  - Standard blood test (CBC)
  - Lipid profile
  - Thyroid panel
- Verify parameter extraction works across formats
- Fix any edge cases

**Task 4.3: Hindi + Tamil Testing (1 hr)**
- Switch language to Hindi, verify translation quality
- Switch to Tamil, verify translation quality
- Test audio playback in both languages
- Verify disclaimers appear in correct language

**Task 4.4: UI Polish (0.5 hrs)**
- Responsive design (test on mobile viewport)
- Touch targets ≥ 48px
- Font sizes readable (16px minimum body text)
- Error messages in selected language

### Day 5 (3 hrs): Deploy + Final

**Task 5.1: Deploy Backend (1 hr)**
- Package Lambda with dependencies
- Deploy via SAM or manual zip upload
- Test API Gateway endpoints

**Task 5.2: Deploy Frontend (0.5 hrs)**
- Build: `npm run build`
- Deploy to AWS Amplify
- Verify live URL works

**Task 5.3: Final End-to-End Test (1 hr)**
- Test on deployed URL (not localhost)
- Test on mobile phone browser
- Upload real lab report → get results → play audio
- Test both Hindi and Tamil

**Task 5.4: Demo Preparation (0.5 hrs)**
- Prepare 2 lab report images for live demo
- Test the exact demo flow you'll show to judges
- Note any quirks or timing to account for

---

## API Contract

### POST /api/lab-samjho/analyze

**Request:**
```
Content-Type: multipart/form-data

Fields:
- image: File (JPEG/PNG/PDF, max 10MB)
- language: string ("hindi" | "tamil" | "english")
- user_id: string (optional, for history)
```

**Response (200):**
```json
{
  "interaction_id": "uuid-string",
  "parameters": [
    {
      "name": "Hemoglobin",
      "value": "12.5",
      "unit": "g/dL",
      "reference_range": "12.0-16.0",
      "classification": "Normal",
      "explanation": "Your hemoglobin level is within the healthy range.",
      "explanation_translated": "आपका हीमोग्लोबिन स्तर सामान्य सीमा में है।"
    }
  ],
  "summary": "Overall summary in selected language",
  "audio_url": "https://s3.amazonaws.com/..../summary.mp3",
  "attention_needed": ["Blood Sugar", "Cholesterol"],
  "disclaimer": "Disclaimer in selected language",
  "extracted_text": "Raw OCR text for debugging"
}
```

**Error Response (400):**
```json
{
  "error": "image_quality_low",
  "message": "कृपया एक स्पष्ट फोटो अपलोड करें। (Please upload a clearer photo.)",
  "confidence": 0.65
}
```

---

## Key Technical Notes

1. **Textract Table Extraction**: Use `FeatureTypes=['TABLES']` specifically - lab reports are almost always in table format. Parse the table blocks to get structured parameter-value-range tuples.

2. **Bedrock Prompt Engineering**: The prompt must ask for JSON output. Include examples of expected classification logic. Test edge cases: what happens with ranges like "<200" or ">10"?

3. **Image Compression**: Before uploading to S3, compress images to max 2MB to save Textract costs and speed up processing.

4. **Sarvam TTS Length**: If the summary is very long, Sarvam TTS may timeout. Split into chunks of ~500 characters and concatenate audio.

5. **Cost Estimation**:
   - Textract: ~$1.50 per 1000 pages → negligible for demo
   - Bedrock Sonnet 4.6: ~$3/M input, $15/M output → ~$0.02 per analysis
   - Sarvam: Free tier should cover demo
   - Total for 100 test runs: ~$5-10
