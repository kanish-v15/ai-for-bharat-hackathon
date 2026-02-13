# SwasthyaMitra Design Document

## Overview

SwasthyaMitra is a voice-first healthcare assistant leveraging AWS AI/ML services to provide accessible healthcare information to the Indian population. The system processes three primary workflows: lab report interpretation (Lab Samjho), voice-based medical Q&A (Care Guide), and doctor consultation documentation (MedScribe). All workflows emphasize accessibility for low-literacy users through voice-first interaction, large visual elements, and multi-language support.

The architecture follows a serverless, event-driven pattern using AWS Lambda, API Gateway, and managed AI services. This approach ensures scalability, cost-efficiency, and minimal operational overhead while maintaining HIPAA-compliant data handling through encryption and audit logging.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Mobile App (AWS Amplify)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Lab Samjho   │  │ Care Guide   │  │ MedScribe    │          │
│  │ (UI Layer)   │  │ (UI Layer)   │  │ (UI Layer)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │  API Gateway      │
                    │  (REST Endpoints) │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │ Lambda   │          │ Lambda   │          │ Lambda   │
   │ Lab      │          │ Care     │          │ MedScribe│
   │ Samjho   │          │ Guide    │          │ Handler  │
   └────┬────┘          └────┬────┘          └────┬────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────────┐  ┌────────▼────────┐  ┌──────▼──────┐
   │ Amazon      │  │ Amazon Bedrock  │  │ Amazon      │
   │ Textract    │  │ (Claude 3)      │  │ Comprehend  │
   │             │  │                 │  │ Medical     │
   └────┬────────┘  └────────┬────────┘  └──────┬──────┘
        │                    │                  │
   ┌────▼────────┐  ┌────────▼────────┐  ┌──────▼──────┐
   │ Amazon      │  │ Amazon          │  │ Amazon      │
   │ Transcribe  │  │ Translate       │  │ Polly       │
   │             │  │                 │  │             │
   └────┬────────┘  └────────┬────────┘  └──────┬──────┘
        │                    │                  │
        └────────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────────┐  ┌────────▼────────┐  ┌──────▼──────┐
   │ DynamoDB    │  │ S3 (Audio/      │  │ CloudWatch  │
   │ (Sessions,  │  │ Images)         │  │ (Logs,      │
   │ History)    │  │                 │  │ Metrics)    │
   └─────────────┘  └─────────────────┘  └─────────────┘
```

### Data Flow: Lab Samjho (Lab Report Interpretation)

```
User uploads lab report image
        │
        ▼
API Gateway → Lambda (Lab Samjho Handler)
        │
        ├─→ Amazon Textract (Extract text/tables)
        │
        ├─→ Store extracted text in DynamoDB
        │
        ├─→ Amazon Bedrock (Analyze parameters)
        │
        ├─→ Store analysis in DynamoDB
        │
        ├─→ Amazon Translate (Convert to native language)
        │
        ├─→ Amazon Polly (Generate audio)
        │
        ├─→ Store audio in S3
        │
        └─→ Return results to mobile app
```

### Data Flow: Care Guide (Voice-Based Medical Q&A)

```
User asks question via voice
        │
        ▼
API Gateway → Lambda (Care Guide Handler)
        │
        ├─→ Amazon Transcribe (Convert audio to text)
        │
        ├─→ Amazon Translate (Convert to English)
        │
        ├─→ Amazon Bedrock (Generate medical response)
        │
        ├─→ Amazon Translate (Convert to native language)
        │
        ├─→ Amazon Polly (Generate audio response)
        │
        ├─→ Store interaction in DynamoDB
        │
        ├─→ Store audio in S3
        │
        └─→ Return results to mobile app
```

### Data Flow: MedScribe (Doctor Documentation)

```
Doctor records consultation
        │
        ▼
API Gateway → Lambda (MedScribe Handler)
        │
        ├─→ Amazon Transcribe (Convert audio to text)
        │
        ├─→ Amazon Bedrock (Generate SOAP notes)
        │
        ├─→ Amazon Comprehend Medical (Extract entities)
        │
        ├─→ Store SOAP notes in DynamoDB
        │
        ├─→ Amazon Translate (Generate patient instructions)
        │
        ├─→ Amazon Polly (Generate audio instructions)
        │
        ├─→ Store audio in S3
        │
        └─→ Return results to mobile app
```

## Components and Interfaces

### 1. Mobile Application (AWS Amplify)

**Responsibilities:**
- User interface for all three features
- Voice recording and playback
- Image capture and upload
- Session management and authentication
- Offline queue for requests
- Local caching of responses

**Key Interfaces:**
- `LabSamjhoUI`: Image upload, parameter display, audio playback
- `CareGuideUI`: Voice input, response display, history
- `MedScribeUI`: Recording controls, SOAP note display, patient instructions

**Technology Stack:**
- React Native or Flutter for cross-platform compatibility
- AWS Amplify for authentication and API integration
- Local storage for offline capability

### 2. API Gateway

**Responsibilities:**
- Route requests to appropriate Lambda functions
- Handle authentication and authorization
- Rate limiting and throttling
- Request/response transformation
- CORS handling for mobile clients

**Endpoints:**
- `POST /lab-samjho/upload` - Upload lab report image
- `POST /care-guide/ask` - Submit voice question
- `POST /medscribe/record` - Submit consultation audio
- `GET /history/{userId}` - Retrieve user history
- `GET /history/{userId}/{interactionId}` - Retrieve specific interaction

### 3. Lambda Functions

#### Lab Samjho Handler
```
Input: Lab report image (JPEG/PNG/PDF)
Process:
  1. Validate image format and size
  2. Call Amazon Textract to extract text
  3. Parse extracted text for lab parameters
  4. Call Amazon Bedrock to classify parameters
  5. Call Amazon Translate to convert summary
  6. Call Amazon Polly to generate audio
  7. Store results in DynamoDB
  8. Upload audio to S3
Output: Classification results, summary, audio URL
```

#### Care Guide Handler
```
Input: Voice audio (WAV/MP3)
Process:
  1. Call Amazon Transcribe to convert to text
  2. Call Amazon Translate to convert to English
  3. Call Amazon Bedrock to generate response
  4. Call Amazon Translate to convert to native language
  5. Call Amazon Polly to generate audio
  6. Store interaction in DynamoDB
  7. Upload audio to S3
Output: Medical response, audio URL
```

#### MedScribe Handler
```
Input: Consultation audio (WAV/MP3)
Process:
  1. Call Amazon Transcribe to convert to text
  2. Call Amazon Bedrock to generate SOAP notes
  3. Call Amazon Comprehend Medical to extract entities
  4. Validate extracted entities
  5. Call Amazon Translate to generate patient instructions
  6. Call Amazon Polly to generate audio instructions
  7. Store SOAP notes and instructions in DynamoDB
  8. Upload audio to S3
Output: SOAP notes, patient instructions, audio URL
```

### 4. Amazon Bedrock (Claude 3)

**Responsibilities:**
- Lab parameter analysis and classification
- Medical question response generation
- SOAP note generation from consultation transcripts
- Patient instruction generation

**Prompts:**

**Lab Parameter Analysis Prompt:**
```
You are a medical AI assistant. Analyze the following lab parameters and classify each as Normal, Borderline, or Abnormal based on standard reference ranges. Provide a brief explanation for each classification.

Lab Parameters:
[extracted lab text]

For each parameter, provide:
1. Parameter name
2. Patient value
3. Reference range
4. Classification (Normal/Borderline/Abnormal)
5. Brief explanation in simple language

Include a disclaimer that this is not a substitute for professional medical advice.
```

**Medical Question Response Prompt:**
```
You are a healthcare assistant providing general health information. Answer the following question based on medical knowledge. Keep the response simple and understandable for a patient with limited medical knowledge.

Question: [user question]

Provide:
1. Simple explanation of the condition/symptom
2. Common causes
3. When to seek professional help
4. General wellness recommendations

Include a disclaimer that this is not a substitute for professional medical advice. If the question involves emergency symptoms, prominently recommend immediate medical attention.
```

**SOAP Note Generation Prompt:**
```
You are a medical documentation assistant. Generate structured SOAP notes from the following consultation transcript.

Consultation Transcript:
[transcribed consultation]

Generate:
1. Subjective: Patient's reported symptoms and history
2. Objective: Examination findings and vital signs
3. Assessment: Diagnosis and clinical impression
4. Plan: Treatment recommendations and follow-up

Use clear, professional medical terminology. Ensure all medications and dosages are clearly specified.
```

### 5. Amazon Textract

**Responsibilities:**
- Extract text and tables from lab report images
- Handle multiple document formats (JPEG, PNG, PDF)
- Preserve table structure for lab parameters

**Configuration:**
- Enable table extraction
- Enable form extraction for structured lab reports
- Confidence threshold: 0.8 (flag low-confidence extractions)

### 6. Amazon Transcribe

**Responsibilities:**
- Convert voice audio to text
- Support multiple Indian languages
- Handle regional accents and dialects

**Configuration:**
- Language: User-selected (Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati)
- Vocabulary customization for medical terms
- Confidence scoring for quality assessment

### 7. Amazon Translate

**Responsibilities:**
- Translate between English and Indian languages
- Preserve medical terminology accuracy
- Maintain cultural appropriateness

**Configuration:**
- Source/target languages: English ↔ Indian languages
- Custom terminology for medical terms
- Formality: Formal for medical content, conversational for patient instructions

### 8. Amazon Polly

**Responsibilities:**
- Generate natural-sounding audio in multiple languages
- Support for Indian language voices
- Appropriate pacing for medical content

**Configuration:**
- Voice: Neural voices for Indian languages
- Speech rate: 0.9 (slightly slower for clarity)
- Engine: Neural (for natural pronunciation)

### 9. Amazon Comprehend Medical

**Responsibilities:**
- Extract medical entities from SOAP notes
- Validate medications and dosages
- Identify symptoms, diagnoses, and procedures

**Configuration:**
- Entity types: MEDICATION, DOSAGE, STRENGTH, ROUTE, FREQUENCY, DURATION, SYMPTOM, DIAGNOSIS, PROCEDURE
- Confidence threshold: 0.7

### 10. DynamoDB

**Responsibilities:**
- Store user sessions and authentication data
- Store interaction history (lab reports, questions, consultations)
- Store extracted medical entities
- Audit logging

**Tables:**

**Users Table:**
```
PK: userId (String)
SK: metadata (String)
Attributes:
  - preferredLanguage (String)
  - createdAt (Number)
  - lastLogin (Number)
  - email (String)
  - phone (String)
```

**Interactions Table:**
```
PK: userId (String)
SK: interactionId (String)
Attributes:
  - type (String: "lab_report", "question", "consultation")
  - timestamp (Number)
  - originalContent (String)
  - extractedText (String)
  - analysis (Map)
  - audioUrl (String)
  - language (String)
  - ttl (Number - for automatic cleanup)
```

**Medical Entities Table:**
```
PK: interactionId (String)
SK: entityId (String)
Attributes:
  - entityType (String)
  - value (String)
  - confidence (Number)
  - flagged (Boolean)
  - timestamp (Number)
```

### 11. Amazon S3

**Responsibilities:**
- Store uploaded lab report images
- Store generated audio files
- Store temporary processing files

**Bucket Structure:**
```
swasthya-mitra-storage/
├── lab-reports/
│   └── {userId}/{interactionId}/
│       └── original.jpg
├── audio/
│   └── {userId}/{interactionId}/
│       ├── lab-summary.mp3
│       ├── care-response.mp3
│       └── patient-instructions.mp3
└── temp/
    └── {interactionId}/
        └── [temporary processing files]
```

**Configuration:**
- Encryption: AES-256 (server-side)
- Versioning: Enabled for audit trail
- Lifecycle: Delete temp files after 7 days
- Access: Private with signed URLs for mobile app

## Data Models

### Lab Report Analysis Result
```json
{
  "interactionId": "uuid",
  "userId": "uuid",
  "timestamp": 1234567890,
  "originalImage": "s3://bucket/path",
  "extractedText": "string",
  "parameters": [
    {
      "name": "Hemoglobin",
      "value": 12.5,
      "unit": "g/dL",
      "referenceRange": "12.0-16.0",
      "classification": "Normal",
      "explanation": "Your hemoglobin level is within normal range..."
    }
  ],
  "summary": "string (in native language)",
  "audioUrl": "s3://bucket/path/audio.mp3",
  "language": "hi",
  "disclaimer": "string (in native language)"
}
```

### Medical Question Response
```json
{
  "interactionId": "uuid",
  "userId": "uuid",
  "timestamp": 1234567890,
  "originalQuestion": "string (in native language)",
  "transcribedText": "string (in native language)",
  "englishText": "string",
  "response": "string (in native language)",
  "audioUrl": "s3://bucket/path/audio.mp3",
  "language": "hi",
  "disclaimer": "string (in native language)",
  "emergencyFlag": false
}
```

### SOAP Note with Patient Instructions
```json
{
  "interactionId": "uuid",
  "doctorId": "uuid",
  "patientId": "uuid",
  "timestamp": 1234567890,
  "consultationAudio": "s3://bucket/path",
  "transcribedText": "string",
  "soapNote": {
    "subjective": "string",
    "objective": "string",
    "assessment": "string",
    "plan": "string"
  },
  "extractedEntities": [
    {
      "type": "MEDICATION",
      "value": "Aspirin",
      "confidence": 0.95,
      "flagged": false
    }
  ],
  "patientInstructions": "string (in patient's native language)",
  "instructionAudioUrl": "s3://bucket/path/audio.mp3",
  "language": "hi",
  "disclaimer": "string (in native language)"
}
```



## Error Handling

### Lab Samjho Error Scenarios

1. **Invalid Image Format**
   - Error: User uploads unsupported file format
   - Handling: Return user-friendly error in native language, suggest supported formats
   - Logging: Log attempt with file type and user ID

2. **Low Image Quality**
   - Error: Textract confidence < 0.8
   - Handling: Flag uncertain sections, ask user to re-upload clearer image
   - Logging: Log confidence scores for quality monitoring

3. **Unrecognized Lab Parameters**
   - Error: Extracted text doesn't match known lab parameters
   - Handling: Display extracted text for user review, flag for manual doctor review
   - Logging: Log unrecognized parameters for model improvement

4. **Bedrock API Failure**
   - Error: Amazon Bedrock service unavailable
   - Handling: Retry with exponential backoff (3 attempts), display offline message
   - Logging: Log API errors with timestamp and request ID

### Care Guide Error Scenarios

1. **Poor Audio Quality**
   - Error: Transcribe confidence < 0.7
   - Handling: Highlight uncertain words, ask user to repeat
   - Logging: Log confidence scores and audio characteristics

2. **Emergency Symptom Detection**
   - Error: User asks about emergency symptoms
   - Handling: Display emergency contact information prominently, recommend immediate medical attention
   - Logging: Log emergency flags for follow-up analysis

3. **Translation Failure**
   - Error: Amazon Translate returns low-quality translation
   - Handling: Log issue, continue with available translation, flag for manual review
   - Logging: Log translation quality metrics

### MedScribe Error Scenarios

1. **Medication Validation Failure**
   - Error: Amazon Comprehend Medical flags invalid medication/dosage
   - Handling: Highlight flagged entities, require doctor confirmation before saving
   - Logging: Log flagged entities for clinical review

2. **SOAP Note Generation Issues**
   - Error: Bedrock generates incomplete or incoherent SOAP notes
   - Handling: Display generated notes for doctor review and editing
   - Logging: Log generation quality metrics

### General Error Handling

1. **Network Connectivity**
   - Handling: Queue requests locally, sync when connection restored
   - Logging: Log offline periods and sync status

2. **Authentication Failure**
   - Handling: Redirect to login, display clear error message
   - Logging: Log failed authentication attempts

3. **Rate Limiting**
   - Handling: Implement exponential backoff, display user-friendly message
   - Logging: Log rate limit events for capacity planning

4. **Data Privacy Violations**
   - Handling: Reject requests, log incident, alert security team
   - Logging: Comprehensive audit trail with user ID, timestamp, action

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property-Based Testing Overview

Property-based testing validates software correctness by testing universal properties across many generated inputs. Each property is a formal specification that should hold for all valid inputs.

**Core Principles:**
1. **Universal Quantification**: Every property must contain an explicit "for all" statement
2. **Requirements Traceability**: Each property must reference the requirements it validates
3. **Executable Specifications**: Properties must be implementable as automated tests
4. **Comprehensive Coverage**: Properties should cover all testable acceptance criteria

### Correctness Properties

**Property 1: Lab Parameter Classification Consistency**
*For any* lab report with extracted parameters, the classification (Normal/Borderline/Abnormal) should be consistent when the same report is analyzed multiple times with the same reference ranges.
**Validates: Requirements 2.1, 2.2, 2.3**

**Property 2: Lab Report Round-Trip Preservation**
*For any* lab report, extracting text via Textract, analyzing via Bedrock, and storing in DynamoDB should preserve all parameter values and reference ranges without loss or corruption.
**Validates: Requirements 1.1, 2.1, 2.2**

**Property 3: Translation Accuracy Preservation**
*For any* medical summary in English, translating to a native language and back to English should preserve the core medical meaning and parameter values.
**Validates: Requirements 3.1, 8.1**

**Property 4: Audio Generation Completeness**
*For any* text summary, Amazon Polly should generate audio that includes all parameter names, values, and classifications without omission.
**Validates: Requirements 4.1, 4.2, 4.3**

**Property 5: Voice Question Transcription Accuracy**
*For any* voice question in a native language, Amazon Transcribe should produce text that, when translated to English, preserves the medical intent of the original question.
**Validates: Requirements 5.1, 5.2, 6.1**

**Property 6: Medical Response Disclaimer Inclusion**
*For any* medical response generated by Bedrock, the response should include a disclaimer recommending professional doctor consultation.
**Validates: Requirements 7.1, 7.2, 18.1**

**Property 7: Emergency Symptom Detection**
*For any* question containing emergency symptoms (chest pain, severe bleeding, difficulty breathing), the system should flag it as emergency and display emergency contact information.
**Validates: Requirements 7.4, 18.3**

**Property 8: SOAP Note Structure Completeness**
*For any* consultation transcript, the generated SOAP note should contain all four sections (Subjective, Objective, Assessment, Plan) with relevant clinical information.
**Validates: Requirements 12.1, 12.2**

**Property 9: Medical Entity Extraction Consistency**
*For any* SOAP note, extracting medical entities (medications, dosages, symptoms) should produce consistent results across multiple extraction attempts.
**Validates: Requirements 13.1, 13.2**

**Property 10: Patient Instruction Clarity**
*For any* treatment plan in English, translating to native language and generating audio should produce instructions that include medication names, dosages, timing, and side effects.
**Validates: Requirements 14.1, 14.2, 15.1**

**Property 11: User History Persistence**
*For any* completed interaction (lab report, question, consultation), storing in DynamoDB and retrieving should return identical data without loss or modification.
**Validates: Requirements 16.1, 16.2, 16.3**

**Property 12: Language Preference Consistency**
*For any* user with a selected language preference, all subsequent interactions should use that language for UI text, voice input configuration, and response generation.
**Validates: Requirements 17.1, 17.2, 17.3**

**Property 13: Disclaimer Presence in All Outputs**
*For any* medical advice, analysis, or instruction generated by the system, a disclaimer should be present in the user's native language.
**Validates: Requirements 18.1, 18.2, 18.4**

**Property 14: Audio File Storage and Retrieval**
*For any* generated audio file, storing in S3 and retrieving via signed URL should produce playable audio without corruption.
**Validates: Requirements 4.3, 9.3, 15.3**

**Property 15: Low-Resource Optimization**
*For any* interaction, the total data transmitted should be minimized through compression and caching, keeping mobile data usage under 5MB per interaction.
**Validates: Requirements 19.3, 19.4**

## Testing Strategy

### Dual Testing Approach

SwasthyaMitra requires both unit testing and property-based testing for comprehensive coverage:

**Unit Testing:**
- Specific examples and edge cases
- Integration points between components
- Error conditions and recovery
- Mock AWS service responses

**Property-Based Testing:**
- Universal properties across all inputs
- Comprehensive input coverage through randomization
- Invariant preservation
- Round-trip consistency

### Property-Based Testing Configuration

**Testing Framework:** Hypothesis (Python) or fast-check (TypeScript/JavaScript)

**Test Configuration:**
- Minimum 100 iterations per property test
- Custom generators for medical data (lab parameters, medications, symptoms)
- Shrinking enabled for failure analysis
- Timeout: 30 seconds per test

**Test Tagging Format:**
```
Feature: swasthya-mitra, Property {number}: {property_text}
```

### Unit Testing Strategy

**Lab Samjho Unit Tests:**
- Test Textract response parsing with various lab report formats
- Test parameter classification with edge values (boundary conditions)
- Test error handling for invalid images
- Test DynamoDB storage and retrieval

**Care Guide Unit Tests:**
- Test Transcribe response parsing with various accents
- Test emergency symptom detection with known emergency keywords
- Test translation quality with medical terminology
- Test audio playback URL generation

**MedScribe Unit Tests:**
- Test SOAP note generation with various consultation styles
- Test medical entity extraction with known medications
- Test entity validation and flagging
- Test patient instruction generation

### Integration Testing

**Lab Samjho Integration:**
- End-to-end: Image upload → Textract → Bedrock → Translate → Polly → S3
- Verify all components communicate correctly
- Test with real AWS services in staging environment

**Care Guide Integration:**
- End-to-end: Voice input → Transcribe → Translate → Bedrock → Translate → Polly
- Verify response quality and timing
- Test with various languages and accents

**MedScribe Integration:**
- End-to-end: Audio upload → Transcribe → Bedrock → Comprehend Medical → Translate → Polly
- Verify SOAP note quality and entity extraction
- Test with various consultation scenarios

### Performance Testing

**Metrics:**
- Lab report analysis: < 30 seconds end-to-end
- Care Guide response: < 20 seconds end-to-end
- MedScribe documentation: < 60 seconds end-to-end
- Audio generation: < 10 seconds for 500 words
- Mobile app startup: < 5 seconds

**Load Testing:**
- Simulate 1000 concurrent users
- Monitor Lambda cold start times
- Verify DynamoDB throughput capacity
- Monitor S3 request rates

### Security Testing

**Data Privacy:**
- Verify encryption at rest (S3, DynamoDB)
- Verify encryption in transit (TLS 1.2+)
- Verify signed URLs for S3 access
- Verify audit logging of all medical data access

**Authentication:**
- Test login/logout flows
- Test session expiration
- Test unauthorized access attempts
- Verify JWT token validation

**Medical Data Validation:**
- Test medication name validation
- Test dosage format validation
- Test parameter value range validation
- Test entity extraction accuracy

