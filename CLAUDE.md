# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SwasthyaMitra** is a voice-first AI healthcare assistant for the Indian population, built on AWS serverless architecture. It addresses language barriers, low health literacy, and doctor documentation burnout. The project is currently in the design/planning phase (no source code yet).

## Three Core Features

1. **Lab Samjho** — Lab report interpretation: photo upload → Textract OCR → Bedrock analysis → translated summary + audio
2. **Care Guide** — Voice-based medical Q&A: voice input → Transcribe → Translate → Bedrock response → translated audio reply
3. **MedScribe** — Doctor documentation: consultation recording → Transcribe → Bedrock SOAP notes → Comprehend Medical entity extraction → patient instructions in native language

## Architecture

- **Serverless, event-driven** pattern using AWS Lambda + API Gateway
- **Frontend**: Mobile app via AWS Amplify (React Native or Flutter), optimized for basic smartphones (<50MB)
- **AI/ML services**: Amazon Bedrock (Claude) for analysis/generation, Textract for OCR, Transcribe for speech-to-text, Translate for multilingual support, Polly for text-to-speech, Comprehend Medical for entity extraction
- **Storage**: DynamoDB (sessions, history, medical entities), S3 (images, audio files), CloudWatch (logs/metrics)
- **Multi-language**: Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati

## API Endpoints

- `POST /lab-samjho/upload` — Upload lab report image (JPEG/PNG/PDF)
- `POST /care-guide/ask` — Submit voice question (WAV/MP3)
- `POST /medscribe/record` — Submit consultation audio (WAV/MP3)
- `GET /history/{userId}` — Retrieve user history
- `GET /history/{userId}/{interactionId}` — Retrieve specific interaction

## DynamoDB Tables

- **Users**: PK=userId, stores language preference and profile
- **Interactions**: PK=userId, SK=interactionId, stores lab reports/questions/consultations with type, analysis, audioUrl, language
- **Medical Entities**: PK=interactionId, SK=entityId, stores extracted entities with type, confidence, flagged status

## S3 Bucket Structure

`swasthya-mitra-storage/` with paths: `lab-reports/{userId}/{interactionId}/`, `audio/{userId}/{interactionId}/`, `temp/{interactionId}/`

## Key Design Constraints

- All medical outputs must include a disclaimer recommending professional consultation
- Emergency symptom detection must flag and show emergency contacts prominently
- Audio compressed before transmission to minimize data usage
- Textract confidence threshold: 0.8; Comprehend Medical threshold: 0.7
- Offline queue support: requests queued locally and synced when connectivity returns
- S3 objects encrypted AES-256 with signed URLs for access

## Testing

- **Frameworks**: Hypothesis (Python) or fast-check (TypeScript/JavaScript) for property-based testing
- **Property tests**: min 100 iterations, 30s timeout, custom generators for medical data
- **Tag format**: `Feature: swasthya-mitra, Property {number}: {property_text}`
- **Performance targets**: Lab analysis <30s, Care Guide <20s, MedScribe <60s, audio gen <10s for 500 words

## Reference Documents

- `Resource/requirements.md` — Full requirements with 20 user stories and acceptance criteria
- `Resource/design.md` — Detailed architecture, component interfaces, data models, error handling, and correctness properties
