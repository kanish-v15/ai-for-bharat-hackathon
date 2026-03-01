# Shared Foundation - Built by Claude (Day 1)

## Overview
This document covers the project scaffolding, shared components, and AWS infrastructure that all 3 team members build on top of.

---

## Project Structure

```
swasthya-mitra/
├── frontend/                    # React + Vite + TailwindCSS
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/          # Shared UI components
│   │   │   ├── Layout.jsx       # App shell - header, nav, footer
│   │   │   ├── LanguageSelector.jsx  # Hindi/Tamil/English toggle
│   │   │   ├── AudioPlayer.jsx  # Play/pause TTS audio
│   │   │   ├── VoiceRecorder.jsx # Mic button + recording logic
│   │   │   ├── Disclaimer.jsx   # Medical disclaimer banner
│   │   │   ├── LoadingSpinner.jsx # AI processing animation
│   │   │   └── FeatureCard.jsx  # Home page feature cards
│   │   ├── pages/
│   │   │   ├── Home.jsx         # Landing page with 3 feature cards
│   │   │   ├── LabSamjho.jsx    # Saravana's feature
│   │   │   ├── CareGuide.jsx    # Sarmitha's feature
│   │   │   └── MedScribe.jsx    # Kanish's feature
│   │   ├── services/
│   │   │   └── api.js           # Axios client for backend calls
│   │   ├── context/
│   │   │   └── LanguageContext.jsx # Global language state
│   │   ├── utils/
│   │   │   └── constants.js     # API URLs, language codes, config
│   │   ├── App.jsx              # Router setup
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Tailwind imports + global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── backend/                     # Python FastAPI + Lambda
│   ├── app/
│   │   ├── main.py              # FastAPI app + Mangum handler
│   │   ├── routers/
│   │   │   ├── lab_samjho.py    # Saravana's endpoints
│   │   │   ├── care_guide.py    # Sarmitha's endpoints
│   │   │   └── medscribe.py     # Kanish's endpoints
│   │   ├── services/
│   │   │   ├── bedrock_service.py   # Bedrock client (Sonnet 4.6 + Nova Lite)
│   │   │   ├── sarvam_service.py    # Sarvam AI client (STT, TTS, Translate)
│   │   │   ├── textract_service.py  # AWS Textract client
│   │   │   ├── comprehend_service.py # AWS Comprehend Medical client
│   │   │   ├── s3_service.py        # S3 upload/download + signed URLs
│   │   │   └── dynamodb_service.py  # DynamoDB CRUD operations
│   │   ├── prompts/
│   │   │   ├── lab_analysis.py      # Bedrock prompt for lab report analysis
│   │   │   ├── medical_qa.py        # Bedrock prompt for Care Guide Q&A
│   │   │   └── soap_notes.py        # Bedrock prompt for SOAP generation
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic models for request/response
│   │   └── config.py                # Environment variables, AWS config
│   ├── requirements.txt
│   ├── template.yaml               # SAM template for Lambda deployment
│   └── Dockerfile                   # For local development
│
├── docs/
│   └── plans/                       # Implementation docs (this folder)
├── market-research.md
├── requirements.md
├── design.md
└── README.md
```

---

## Shared Backend Services

### 1. bedrock_service.py

```python
# Core Bedrock client wrapping both Claude Sonnet 4.6 and Amazon Nova Lite
#
# Functions:
#   invoke_sonnet(prompt, system_prompt) -> str
#     - Uses Claude Sonnet 4.6 for heavy medical reasoning
#     - Model ID: anthropic.claude-sonnet-4-6-20250514-v1:0
#     - Max tokens: 4096
#     - Temperature: 0.3 (low for medical accuracy)
#
#   invoke_nova_lite(prompt) -> str
#     - Uses Amazon Nova Lite for light tasks (summarization, translation fallback)
#     - Model ID: amazon.nova-lite-v1:0
#     - Max tokens: 2048
#
#   analyze_lab_report(extracted_text, language) -> dict
#     - Calls invoke_sonnet with lab_analysis prompt
#     - Returns: {parameters: [...], summary: str, disclaimer: str}
#
#   answer_medical_question(question, language) -> dict
#     - Calls invoke_sonnet with medical_qa prompt
#     - Returns: {answer: str, emergency_flag: bool, disclaimer: str}
#
#   generate_soap_notes(transcript) -> dict
#     - Calls invoke_sonnet with soap_notes prompt
#     - Returns: {subjective: str, objective: str, assessment: str, plan: str}
#
#   simplify_text(text, target_language) -> str
#     - Calls invoke_nova_lite for text simplification
#     - Returns simplified text
```

### 2. sarvam_service.py

```python
# Sarvam AI client for Indian language voice processing
# API Base: https://api.sarvam.ai
#
# Functions:
#   speech_to_text(audio_bytes, language_code) -> str
#     - Uses Sarvam Saarika STT API
#     - language_code: "hi-IN" (Hindi) or "ta-IN" (Tamil)
#     - Input: WAV/WebM audio bytes
#     - Returns: transcribed text
#
#   text_to_speech(text, language_code) -> bytes
#     - Uses Sarvam Bulbul TTS API
#     - language_code: "hi-IN" or "ta-IN"
#     - Returns: MP3 audio bytes
#
#   translate(text, source_lang, target_lang) -> str
#     - Uses Sarvam Mayura Translation API
#     - source_lang/target_lang: "hi" | "ta" | "en"
#     - Returns: translated text
#
# Language code mapping:
#   LANGUAGE_MAP = {
#     "hindi": {"sarvam_stt": "hi-IN", "sarvam_tts": "hi-IN", "translate": "hi"},
#     "tamil": {"sarvam_stt": "ta-IN", "sarvam_tts": "ta-IN", "translate": "ta"},
#     "english": {"sarvam_stt": "en-IN", "sarvam_tts": "en-IN", "translate": "en"}
#   }
```

### 3. textract_service.py

```python
# AWS Textract client for Lab Samjho OCR
#
# Functions:
#   extract_text_from_image(image_bytes) -> dict
#     - Calls Textract detect_document_text or analyze_document
#     - Enables TABLE extraction for lab report tables
#     - Returns: {raw_text: str, tables: [...], confidence: float}
#
#   extract_from_s3(bucket, key) -> dict
#     - Same but reads from S3 location
```

### 4. comprehend_service.py

```python
# AWS Comprehend Medical client for MedScribe entity extraction
#
# Functions:
#   extract_medical_entities(text) -> list
#     - Calls detect_entities_v2
#     - Returns: [{type: "MEDICATION", value: "Aspirin", confidence: 0.95}, ...]
#     - Entity types: MEDICATION, DOSAGE, STRENGTH, FREQUENCY, SYMPTOM, DIAGNOSIS
#
#   validate_entities(entities) -> list
#     - Flags entities with confidence < 0.7
#     - Returns entities with flagged=True/False
```

### 5. s3_service.py

```python
# S3 operations for file storage
# Bucket: swasthya-mitra-{env}
#
# Functions:
#   upload_image(image_bytes, user_id, interaction_id) -> str
#     - Uploads to lab-reports/{user_id}/{interaction_id}/original.{ext}
#     - Returns S3 key
#
#   upload_audio(audio_bytes, user_id, interaction_id, audio_type) -> str
#     - Uploads to audio/{user_id}/{interaction_id}/{audio_type}.mp3
#     - Returns S3 key
#
#   get_signed_url(s3_key, expiry=3600) -> str
#     - Returns pre-signed URL for frontend to access
#
#   download_file(s3_key) -> bytes
#     - Downloads file from S3
```

### 6. dynamodb_service.py

```python
# DynamoDB operations
# Table: swasthya-mitra-interactions
#
# Functions:
#   save_interaction(user_id, interaction_type, data) -> str
#     - Saves lab report / question / consultation data
#     - Returns interaction_id
#
#   get_interaction(user_id, interaction_id) -> dict
#     - Retrieves a specific interaction
#
#   get_user_history(user_id) -> list
#     - Returns all interactions for a user, sorted by timestamp
```

---

## Shared Frontend Components

### 1. LanguageSelector.jsx
- Dropdown/toggle with 3 options: Hindi, Tamil, English
- Stores selection in React Context + localStorage
- Every page reads from this context
- Visual: Flag icons or language name in native script (हिंदी, தமிழ், English)

### 2. VoiceRecorder.jsx
- Large mic button (accessible, low-literacy friendly)
- Uses browser MediaRecorder API
- States: idle → recording → processing
- Visual feedback: pulsing red circle when recording
- Outputs: WebM or WAV audio blob
- Props: `onRecordingComplete(audioBlob)`, `disabled`, `language`

### 3. AudioPlayer.jsx
- Play/pause button with progress bar
- Accepts audio URL (S3 signed URL) or audio blob
- Auto-play option for accessibility
- Visual: speaker icon + waveform animation
- Props: `audioUrl`, `autoPlay`, `label`

### 4. Disclaimer.jsx
- Medical disclaimer banner shown on every result page
- Text varies by language (pulled from constants)
- Hindi: "यह पेशेवर चिकित्सा सलाह का विकल्प नहीं है। कृपया डॉक्टर से परामर्श करें।"
- Tamil: "இது தொழில்முறை மருத்துவ ஆலோசனைக்கு மாற்றாக அல்ல. உங்கள் மருத்துவரை அணுகவும்."
- Styled with yellow/amber warning appearance

### 5. Layout.jsx
- App shell with:
  - Header: SwasthyaMitra logo + language selector
  - Bottom navigation: 3 tabs (Lab Samjho, Care Guide, MedScribe)
  - Large touch targets (48px minimum) for low-literacy users
  - Icons with text labels for each tab

### 6. LoadingSpinner.jsx
- "AI is analyzing..." animation
- Shows step-by-step progress: "Extracting text..." → "Analyzing..." → "Translating..." → "Generating audio..."
- Makes the wait feel productive

---

## AWS Infrastructure (SAM Template)

### Resources to create:
1. **S3 Bucket**: `swasthya-mitra-storage` (images + audio)
2. **DynamoDB Table**: `swasthya-mitra-interactions` (PK: userId, SK: interactionId)
3. **API Gateway**: REST API with CORS enabled
4. **Lambda Function**: Single function with FastAPI + Mangum (routes handle feature separation)
5. **IAM Role**: Lambda execution role with permissions for Textract, Bedrock, Comprehend Medical, S3, DynamoDB

### API Endpoints:
```
POST /api/lab-samjho/analyze    → Lab report upload + analysis
POST /api/care-guide/ask        → Voice question → answer
POST /api/medscribe/process     → Consultation audio → SOAP notes
GET  /api/history/{user_id}     → User interaction history
```

---

## Environment Variables

```
# AWS
AWS_REGION=ap-south-1
S3_BUCKET=swasthya-mitra-storage
DYNAMODB_TABLE=swasthya-mitra-interactions

# Sarvam AI
SARVAM_API_KEY=<your-key>
SARVAM_API_BASE=https://api.sarvam.ai

# Bedrock Model IDs
BEDROCK_SONNET_MODEL=anthropic.claude-sonnet-4-6-20250514-v1:0
BEDROCK_NOVA_MODEL=amazon.nova-lite-v1:0
```

---

## Setup Instructions (All Team Members)

### 1. Clone the repo
```bash
git clone <repo-url>
cd swasthya-mitra
```

### 2. Frontend setup
```bash
cd frontend
npm install
npm run dev    # Runs on http://localhost:5173
```

### 3. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Environment
- Copy `.env.example` to `.env`
- Fill in your AWS credentials and Sarvam API key
- Configure AWS CLI: `aws configure` (region: ap-south-1)

### 5. Enable Bedrock models
- Go to AWS Console → Bedrock → Model Access
- Request access to: Claude Sonnet 4.6, Amazon Nova Lite
- This can take a few minutes to approve

---

## Git Workflow

- `main` branch = production (deployed to Amplify)
- Each person works on their feature branch:
  - `saravana/lab-samjho`
  - `sarmitha/care-guide`
  - `kanish/medscribe`
- Merge to `main` when feature is working
- NO force pushes to main
