# SwasthyaMitra - AI-Powered Voice-First Healthcare Assistant for Bharat

**SwasthyaMitra** (Health Friend) is a voice-first, multilingual AI healthcare assistant designed for the Indian population. It bridges language barriers, simplifies complex medical information, and automates doctor documentation using 10+ AWS AI/ML services.

**Live Demo:** [swasthyamitra.org](https://swasthyamitra.org)

---

## Problem Statement

India faces critical healthcare challenges:
- **Language Barriers:** 780M+ Indians don't speak English; medical reports are almost always in English
- **Low Health Literacy:** Patients receive lab reports but cannot understand what the values mean
- **Doctor Burnout:** Indian doctors see 50-80 patients/day; documentation takes 30-40% of their time
- **Limited Access:** Rural areas have 1 doctor per 10,000 people; patients need basic guidance before traveling hours to a clinic

## Solution

SwasthyaMitra provides three AI-powered features accessible in **9 Indian languages** via voice:

### 1. Lab Samjho (Understand Your Lab Report)
Upload any medical document (blood test PDF, X-ray, ECG, MRI scan) and get an instant AI explanation in your language with voice narration.

**Flow:** Upload document -> Textract OCR/Vision analysis -> Bedrock AI interpretation -> Translate to patient's language -> Polly voice output

### 2. Care Guide (AI Health Companion)
Ask health questions by voice or text in any Indian language. Get personalized advice with Indian home remedies, diet tips, and when to see a doctor.

**Flow:** Voice input -> Transcribe STT -> Translate to English -> Bedrock AI reasoning -> Translate response -> Polly voice output

### 3. MedScribe (Doctor Documentation AI)
Doctors record consultations naturally. AI generates structured SOAP notes, extracts medications, identifies medical entities, and creates patient instructions in the patient's native language.

**Flow:** Recording -> Transcribe STT -> Bedrock SOAP generation -> Comprehend Medical entity extraction -> PDF generation

---

## Architecture

```
                    +------------------+
                    |   React Frontend |
                    |   (AWS Amplify)  |
                    +--------+---------+
                             |
                    +--------v---------+
                    |  API Gateway +   |
                    |  AWS Lambda      |
                    |  (FastAPI+Mangum)|
                    +--------+---------+
                             |
        +--------------------+--------------------+
        |                    |                    |
+-------v-------+   +-------v-------+   +-------v-------+
|    AI/ML      |   |   Storage     |   |     Auth      |
|               |   |               |   |               |
| Bedrock(Nova) |   | S3 (uploads)  |   | Cognito       |
| Textract      |   | DynamoDB      |   | SNS (OTP)     |
| Transcribe    |   | CloudWatch    |   |               |
| Translate     |   |               |   |               |
| Polly (TTS)   |   |               |   |               |
| Comprehend    |   |               |   |               |
| Medical       |   |               |   |               |
+---------------+   +---------------+   +---------------+
```

## AWS Services Used (12 services)

| Service | Purpose | Feature |
|---------|---------|---------|
| **Amazon Bedrock** (Nova Lite) | LLM for medical analysis, Q&A, SOAP notes | All 3 features |
| **Amazon Textract** | OCR for lab reports, prescriptions, medical documents | Lab Samjho |
| **Amazon Transcribe** | Speech-to-text in 9 Indian languages | Care Guide, MedScribe |
| **Amazon Translate** | Real-time translation between 9 languages + English | All 3 features |
| **Amazon Polly** | Text-to-speech for voice responses (Neural voices) | Care Guide, Lab Samjho |
| **Amazon Comprehend Medical** | Extract medical entities (medications, conditions, tests) | MedScribe |
| **Amazon S3** | Store uploaded documents, audio files, generated reports | All 3 features |
| **Amazon DynamoDB** | User profiles, interaction history, medical entities | All 3 features |
| **Amazon Cognito** | User authentication and authorization | Auth |
| **Amazon SNS** | OTP delivery via SMS for phone verification | Auth |
| **AWS Lambda** | Serverless backend compute (FastAPI + Mangum) | Backend |
| **AWS Amplify** | Frontend hosting with CDN | Frontend |
| **Amazon CloudWatch** | Structured API logging and monitoring | Observability |
| **API Gateway** | HTTP API routing via Lambda Function URL | Backend |

## Why AI is Required

1. **Medical Document Understanding:** Raw OCR text from Textract needs AI (Bedrock) to interpret medical values, classify normal/abnormal, and explain in simple terms
2. **Multilingual Medical Reasoning:** AI generates contextually appropriate medical advice in 9 languages, understanding Indian dietary habits, home remedies, and cultural context
3. **Clinical Documentation:** AI converts unstructured doctor-patient conversation into structured SOAP notes with proper medical terminology
4. **Entity Extraction:** Comprehend Medical identifies medications, dosages, conditions, and procedures from free text with clinical accuracy

## Supported Languages

| Language | Script | Code |
|----------|--------|------|
| Hindi | Devanagari | hi |
| Tamil | Tamil | ta |
| Telugu | Telugu | te |
| Kannada | Kannada | kn |
| Malayalam | Malayalam | ml |
| Bengali | Bengali | bn |
| Marathi | Devanagari | mr |
| Gujarati | Gujarati | gu |
| English | Latin | en |

---

## Project Structure

```
swasthya-mitra/
├── backend/                    # FastAPI backend (Python)
│   ├── app/
│   │   ├── main.py            # FastAPI app + Lambda handler (Mangum)
│   │   ├── config.py          # Environment configuration (Pydantic Settings)
│   │   ├── models/
│   │   │   └── schemas.py     # Pydantic request/response models
│   │   ├── routers/           # API endpoint handlers
│   │   │   ├── auth.py        # OTP login + Cognito auth
│   │   │   ├── lab_samjho.py  # Lab report analysis endpoints
│   │   │   ├── care_guide.py  # Medical Q&A endpoints
│   │   │   ├── medscribe.py   # Doctor documentation endpoints
│   │   │   ├── stt.py         # Speech-to-text endpoint
│   │   │   ├── tts.py         # Text-to-speech endpoint
│   │   │   ├── history.py     # User interaction history
│   │   │   └── users.py       # User profile management
│   │   ├── services/          # AWS service integrations
│   │   │   ├── bedrock_service.py         # Amazon Bedrock (Nova Lite)
│   │   │   ├── textract_service.py        # Amazon Textract (sync + async PDF)
│   │   │   ├── transcribe_service.py      # Amazon Transcribe STT
│   │   │   ├── translate_service.py       # Amazon Translate
│   │   │   ├── polly_service.py           # Amazon Polly TTS (smart routing)
│   │   │   ├── comprehend_medical_service.py # Amazon Comprehend Medical
│   │   │   ├── s3_service.py              # Amazon S3 upload/download
│   │   │   ├── dynamodb_service.py        # Amazon DynamoDB CRUD
│   │   │   ├── cognito_service.py         # Amazon Cognito auth
│   │   │   ├── sns_otp_service.py         # Amazon SNS OTP
│   │   │   ├── cloudwatch_service.py      # CloudWatch structured logging
│   │   │   └── sarvam_service.py          # Sarvam AI TTS fallback
│   │   └── prompts/           # AI prompt templates
│   │       ├── lab_analysis.py  # Lab report analysis prompts
│   │       ├── medical_qa.py    # Care Guide Q&A prompts
│   │       └── soap_notes.py    # MedScribe SOAP prompts
│   ├── tests/                 # Unit tests
│   └── requirements.txt
├── frontend/                  # React + Vite frontend
│   ├── src/
│   │   ├── pages/             # Main feature pages
│   │   │   ├── Home.jsx       # Landing page
│   │   │   ├── LabSamjho.jsx  # Lab report chat interface
│   │   │   ├── CareGuide.jsx  # Voice health Q&A
│   │   │   ├── MedScribe.jsx  # Doctor documentation
│   │   │   ├── Profile.jsx    # User profile with voice input
│   │   │   └── ...
│   │   ├── components/        # Reusable UI components
│   │   │   ├── AudioPlayer.jsx      # Audio playback with waveform
│   │   │   ├── DocumentViewer.jsx   # PDF/image viewer
│   │   │   ├── LoginModal.jsx       # OTP-based auth flow
│   │   │   ├── ThinkingIndicator.jsx # Animated AI processing UI
│   │   │   ├── VoiceRecorder.jsx    # Voice recording component
│   │   │   ├── medscribe/          # MedScribe sub-components
│   │   │   └── profile/            # Profile form components
│   │   ├── context/           # React contexts
│   │   │   ├── AuthContext.jsx      # Auth state management
│   │   │   ├── LanguageContext.jsx  # i18n with t() function
│   │   │   └── NotificationContext.jsx
│   │   ├── services/
│   │   │   ├── api.js         # Axios API client
│   │   │   └── dataStore.js   # Client-side data management
│   │   ├── hooks/
│   │   │   └── useBackendVoice.js  # TTS hook
│   │   └── utils/
│   │       ├── translations.js     # 9-language translation strings
│   │       ├── constants.js        # Language configs, disclaimers
│   │       └── generatePDF.js      # Clinical PDF generation
│   └── vite.config.js
└── amplify.yml                # AWS Amplify build config
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to phone number |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/lab-samjho/analyze` | Upload & analyze lab report |
| POST | `/api/lab-samjho/ask` | Ask follow-up about report |
| POST | `/api/care-guide/ask` | Voice health question |
| POST | `/api/care-guide/ask-text` | Text health question |
| POST | `/api/medscribe/process` | Process consultation audio |
| POST | `/api/medscribe/process-text` | Process consultation text |
| POST | `/api/stt/transcribe` | Speech-to-text |
| POST | `/api/tts/speak` | Text-to-speech |
| GET | `/api/history/{userId}` | Get interaction history |
| GET | `/api/health` | Health check |

## Tech Stack

**Backend:**
- Python 3.13 + FastAPI
- Mangum (Lambda adapter)
- boto3 (AWS SDK)
- Pydantic (validation)

**Frontend:**
- React 19 + Vite
- Tailwind CSS 4
- Lucide React (icons)
- jsPDF (PDF generation)

**Infrastructure:**
- AWS Lambda (serverless compute)
- AWS Amplify (frontend CDN)
- Amazon API Gateway

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- AWS credentials configured (`aws configure`)

### Backend
```bash
cd swasthya-mitra/backend
pip install -r requirements.txt
cp .env.example .env  # Configure AWS settings
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd swasthya-mitra/frontend
npm install
npm run dev  # Starts on http://localhost:5173
```

The frontend Vite dev server proxies `/api` requests to `http://localhost:8000`.

### Environment Variables
```
AWS_REGION=us-east-1
S3_BUCKET=swasthyamitra-uploads
BEDROCK_MODEL_ID=us.amazon.nova-2-lite-v1:0
COGNITO_USER_POOL_ID=...
COGNITO_APP_CLIENT_ID=...
```

## Deployment

**Backend:** Packaged as a zip and deployed to AWS Lambda via `update_function_code`
```bash
cd backend/lambda_package_linux
zip -r ../deploy.zip . -x "*__pycache__*"
# Upload to Lambda function: swasthyamitra-backend
```

**Frontend:** Built with Vite and deployed to AWS Amplify
```bash
cd frontend
npm run build
# Deploy dist/ to Amplify via CreateDeployment API
```

---

## Key Design Decisions

1. **Voice-First:** Every feature supports voice input/output because many target users are more comfortable speaking than typing
2. **Serverless:** Lambda + API Gateway = zero idle cost, auto-scaling for hackathon demo
3. **Smart TTS Routing:** Amazon Polly for Hindi/English (best quality), Sarvam Bulbul for other Indian languages (wider coverage)
4. **Async Textract for PDFs:** Sync Textract API only supports images; we use S3-based async API for multi-page PDF extraction
5. **Multi-Page Vision:** PDFs are converted to page images and sent to Bedrock Nova for visual analysis (catches charts, graphs, X-rays)
6. **Language-Aware AI:** Prompts instruct the LLM to respond directly in the user's language, with Amazon Translate as fallback
7. **Emergency Detection:** Keyword-based + AI-based emergency detection flags critical symptoms (chest pain, unconsciousness)
8. **Indian Context:** AI is prompted with Indian home remedies (haldi milk, tulsi tea), food habits (dal-chawal, khichdi), and cultural sensitivity

## Team

Built for the **AI for Bharat Hackathon 2026** by:
- Saravana Rajan
- Kanish V
- Sarmitha

---

## License

This project was built for the AI for Bharat Hackathon 2026.
