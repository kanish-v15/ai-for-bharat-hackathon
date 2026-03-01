# SwasthyaMitra Requirements Document

## Introduction

SwasthyaMitra is a voice-first AI healthcare assistant designed for the Indian population. It addresses three critical challenges: language barriers for patients with limited English proficiency, low health literacy in underserved communities, and documentation burnout for healthcare providers. The system comprises three integrated features: Lab Samjho (lab report interpretation), Care Guide (voice-based medical Q&A), and MedScribe (doctor documentation automation). All features are optimized for basic smartphones with minimal resource requirements and support multiple Indian languages.

## Glossary

- **User**: A patient or healthcare provider interacting with SwasthyaMitra
- **Patient**: An end-user seeking health information or lab report interpretation
- **Doctor**: A healthcare provider using MedScribe for documentation
- **Lab_Report**: A medical document containing laboratory test results
- **Lab_Parameter**: An individual test result with a value and reference range
- **Voice_Input**: Audio captured from user's microphone
- **Native_Language**: The user's preferred language (Hindi, Tamil, Telugu, etc.)
- **SOAP_Note**: Structured medical documentation (Subjective, Objective, Assessment, Plan)
- **Medical_Entity**: Extracted clinical information (medication, dosage, symptom, diagnosis)
- **Disclaimer**: A statement recommending professional doctor consultation
- **System**: SwasthyaMitra application and backend services

## Requirements

### Requirement 1: Lab Report Photo Upload and Text Extraction

**User Story:** As a patient, I want to upload a photo of my lab report, so that I can understand my test results without visiting the clinic.

#### Acceptance Criteria

1. WHEN a patient selects a lab report image from their device, THE System SHALL accept JPEG, PNG, and PDF formats
2. WHEN an image is uploaded, THE System SHALL extract text and tables using Amazon Textract
3. WHEN text extraction is complete, THE System SHALL store the extracted text in DynamoDB for audit and history
4. IF the image quality is insufficient for extraction, THEN THE System SHALL return a user-friendly error message in the patient's native language
5. WHEN extraction completes successfully, THE System SHALL proceed to parameter analysis without user intervention

### Requirement 2: Lab Parameter Analysis and Classification

**User Story:** As a patient, I want my lab parameters classified as Normal, Borderline, or Abnormal, so that I can quickly understand which results need attention.

#### Acceptance Criteria

1. WHEN extracted lab text is available, THE System SHALL use Amazon Bedrock (Claude) to analyze each parameter against standard reference ranges
2. WHEN analyzing parameters, THE System SHALL classify each as Normal, Borderline, or Abnormal based on clinical guidelines
3. WHEN a parameter is classified, THE System SHALL include the reference range and patient's value in the analysis
4. IF a parameter cannot be classified due to missing reference ranges, THEN THE System SHALL mark it as Unclassified and flag for doctor review
5. WHEN analysis is complete, THE System SHALL store results in DynamoDB with timestamp and user ID for historical tracking

### Requirement 3: Lab Report Summary Generation in Native Language

**User Story:** As a patient with limited English proficiency, I want a summary of my lab results in my native language, so that I can understand what the results mean.

#### Acceptance Criteria

1. WHEN parameter analysis is complete, THE System SHALL generate a plain-language summary explaining each parameter's significance
2. WHEN generating the summary, THE System SHALL use Amazon Translate to convert from English to the patient's selected native language
3. WHEN translating, THE System SHALL preserve medical accuracy and use culturally appropriate terminology
4. WHEN translation is complete, THE System SHALL include a disclaimer recommending consultation with a doctor
5. WHEN the summary is ready, THE System SHALL display it in the app with clear formatting suitable for low-literacy users

### Requirement 4: Audio Explanation of Lab Results

**User Story:** As a patient with low literacy, I want to hear an audio explanation of my lab results, so that I can understand them without reading.

#### Acceptance Criteria

1. WHEN a lab report summary is generated, THE System SHALL use Amazon Polly to generate audio in the patient's native language
2. WHEN generating audio, THE System SHALL use a clear, natural voice with appropriate pacing for comprehension
3. WHEN audio generation is complete, THE System SHALL store the audio file in Amazon S3 with appropriate access controls
4. WHEN the user taps the audio button, THE System SHALL play the audio explanation with volume and playback controls
5. WHEN audio is playing, THE System SHALL display visual indicators showing progress and allow pause/resume functionality

### Requirement 5: Voice-Based Medical Question Input

**User Story:** As a patient, I want to ask health questions using my voice, so that I don't need to type on my basic smartphone.

#### Acceptance Criteria

1. WHEN a patient taps the microphone button in Care Guide, THE System SHALL begin recording voice input
2. WHEN recording is active, THE System SHALL display visual feedback indicating recording status
3. WHEN the patient stops speaking or taps stop, THE System SHALL send the audio to Amazon Transcribe for conversion to text
4. IF transcription fails due to poor audio quality, THEN THE System SHALL prompt the user to repeat their question
5. WHEN transcription is complete, THE System SHALL proceed to language translation without user intervention

### Requirement 6: Question Translation to English for Processing

**User Story:** As a system, I need to translate patient questions to English, so that I can process them with Amazon Bedrock's medical knowledge base.

#### Acceptance Criteria

1. WHEN transcribed text is available in a native language, THE System SHALL use Amazon Translate to convert to English
2. WHEN translating, THE System SHALL preserve medical terminology and context
3. IF translation quality is low, THEN THE System SHALL log the issue for manual review but continue processing
4. WHEN translation is complete, THE System SHALL pass the English text to Amazon Bedrock for medical analysis
5. WHEN processing is complete, THE System SHALL store both original and translated text in DynamoDB for audit purposes

### Requirement 7: Medical Question Analysis and Response Generation

**User Story:** As a patient, I want accurate, safe medical guidance for my health questions, so that I can make informed decisions about my health.

#### Acceptance Criteria

1. WHEN an English medical question is received, THE System SHALL use Amazon Bedrock (Claude) to generate a response based on medical knowledge
2. WHEN generating a response, THE System SHALL include a disclaimer that the response is not a substitute for professional medical advice
3. WHEN the response is generated, THE System SHALL include relevant health information, common causes, and when to seek professional help
4. IF the question involves emergency symptoms, THEN THE System SHALL prominently display emergency contact information and recommend immediate medical attention
5. WHEN the response is ready, THE System SHALL proceed to translation back to the patient's native language

### Requirement 8: Response Translation to Native Language

**User Story:** As a patient, I want the medical response in my native language, so that I can fully understand the guidance.

#### Acceptance Criteria

1. WHEN a medical response is generated in English, THE System SHALL use Amazon Translate to convert to the patient's native language
2. WHEN translating, THE System SHALL maintain medical accuracy and use simple, understandable terminology
3. WHEN translation is complete, THE System SHALL include the disclaimer in the patient's native language
4. IF translation quality is low, THEN THE System SHALL log the issue but continue to provide the response
5. WHEN translation is complete, THE System SHALL proceed to audio generation

### Requirement 9: Audio Response Generation for Care Guide

**User Story:** As a patient with low literacy, I want to hear the medical response, so that I can understand the guidance without reading.

#### Acceptance Criteria

1. WHEN a translated medical response is available, THE System SHALL use Amazon Polly to generate audio in the patient's native language
2. WHEN generating audio, THE System SHALL use clear pronunciation and appropriate pacing for medical terminology
3. WHEN audio generation is complete, THE System SHALL store the audio file in Amazon S3
4. WHEN the user taps play, THE System SHALL stream the audio with playback controls
5. WHEN audio is playing, THE System SHALL display the text response simultaneously for users who can read

### Requirement 10: Consultation Audio Recording for MedScribe

**User Story:** As a doctor, I want to record my consultation with a patient, so that I can generate documentation automatically without manual typing.

#### Acceptance Criteria

1. WHEN a doctor starts a consultation session in MedScribe, THE System SHALL provide an option to begin ambient recording
2. WHEN recording begins, THE System SHALL capture audio in the regional language spoken during the consultation
3. WHEN recording is active, THE System SHALL display a visual indicator showing recording status and duration
4. WHEN the consultation ends, THE System SHALL stop recording and send the audio to Amazon Transcribe
5. WHEN the doctor confirms, THE System SHALL proceed to transcription without requiring manual file management

### Requirement 11: Consultation Audio Transcription

**User Story:** As a doctor, I want my consultation audio transcribed to text, so that I have a written record to work from.

#### Acceptance Criteria

1. WHEN consultation audio is submitted, THE System SHALL use Amazon Transcribe to convert audio to text in the regional language
2. WHEN transcription is complete, THE System SHALL display the transcribed text for doctor review and editing
3. IF transcription quality is low, THEN THE System SHALL highlight uncertain sections for manual correction
4. WHEN the doctor confirms the transcription, THE System SHALL store it in DynamoDB with timestamp and doctor ID
5. WHEN transcription is confirmed, THE System SHALL proceed to SOAP note generation

### Requirement 12: SOAP Note Generation from Consultation

**User Story:** As a doctor, I want structured SOAP notes generated from my consultation, so that I can maintain proper medical documentation without manual formatting.

#### Acceptance Criteria

1. WHEN transcribed consultation text is available, THE System SHALL use Amazon Bedrock (Claude) to generate structured SOAP notes
2. WHEN generating SOAP notes, THE System SHALL organize content into Subjective (patient symptoms), Objective (examination findings), Assessment (diagnosis), and Plan (treatment)
3. WHEN generating notes, THE System SHALL extract and highlight medical entities using Amazon Comprehend Medical
4. WHEN notes are generated, THE System SHALL display them in a format suitable for doctor review and editing
5. WHEN the doctor confirms the notes, THE System SHALL store them in DynamoDB as the official medical record

### Requirement 13: Medical Entity Extraction and Validation

**User Story:** As a system, I need to extract and validate medical entities from consultation notes, so that I can ensure accuracy of medications and dosages.

#### Acceptance Criteria

1. WHEN SOAP notes are generated, THE System SHALL use Amazon Comprehend Medical to extract medical entities (medications, dosages, symptoms, diagnoses)
2. WHEN extracting entities, THE System SHALL identify and validate dosage formats and medication names
3. IF a medication or dosage appears invalid, THEN THE System SHALL flag it for doctor review with a warning
4. WHEN entities are extracted, THE System SHALL store them in DynamoDB for clinical decision support
5. WHEN the doctor reviews flagged entities, THE System SHALL allow correction before finalizing the notes

### Requirement 14: Patient Instruction Generation in Native Language

**User Story:** As a patient, I want clear instructions in my native language about my treatment plan, so that I can follow the doctor's recommendations.

#### Acceptance Criteria

1. WHEN SOAP notes are finalized, THE System SHALL extract the Plan section and generate patient-friendly instructions
2. WHEN generating instructions, THE System SHALL use Amazon Translate to convert from English to the patient's native language
3. WHEN translating, THE System SHALL simplify medical terminology and use culturally appropriate language
4. WHEN instructions are generated, THE System SHALL include medication names, dosages, timing, and side effects to watch for
5. WHEN instructions are ready, THE System SHALL display them in the app with visual formatting suitable for low-literacy users

### Requirement 15: Patient Instruction Audio Generation

**User Story:** As a patient with low literacy, I want to hear my treatment instructions, so that I can follow them accurately.

#### Acceptance Criteria

1. WHEN patient instructions are generated in the native language, THE System SHALL use Amazon Polly to generate audio
2. WHEN generating audio, THE System SHALL use clear pronunciation and appropriate pacing for medication names and instructions
3. WHEN audio generation is complete, THE System SHALL store the audio file in Amazon S3
4. WHEN the patient taps play, THE System SHALL stream the audio with playback controls
5. WHEN audio is playing, THE System SHALL display the text instructions simultaneously

### Requirement 16: User Session Management and History

**User Story:** As a patient, I want my previous interactions saved, so that I can review past lab reports and medical advice.

#### Acceptance Criteria

1. WHEN a user logs in, THE System SHALL retrieve their session history from DynamoDB
2. WHEN a user completes an interaction (lab report, question, consultation), THE System SHALL save it with timestamp and user ID
3. WHEN a user views history, THE System SHALL display previous lab reports, questions asked, and responses received
4. WHEN a user selects a previous interaction, THE System SHALL display the full details including audio and translations
5. WHEN a user deletes a history item, THE System SHALL remove it from DynamoDB while maintaining audit logs

### Requirement 17: Multi-Language Support

**User Story:** As a user, I want to use SwasthyaMitra in my native language, so that I can interact comfortably regardless of my English proficiency.

#### Acceptance Criteria

1. WHEN a user first opens the app, THE System SHALL present language selection options (Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati)
2. WHEN a user selects a language, THE System SHALL store the preference in DynamoDB
3. WHEN the user interacts with the app, THE System SHALL display all UI text in the selected language
4. WHEN the user provides voice input, THE System SHALL configure Amazon Transcribe for the selected language
5. WHEN the system generates responses, THE System SHALL use Amazon Translate and Polly with the selected language

### Requirement 18: Responsible AI and Medical Disclaimers

**User Story:** As a healthcare system, I want to ensure users understand the limitations of AI, so that they don't rely solely on SwasthyaMitra for medical decisions.

#### Acceptance Criteria

1. WHEN a user receives any medical advice or analysis, THE System SHALL display a prominent disclaimer stating this is not a substitute for professional medical advice
2. WHEN a user receives lab report analysis, THE System SHALL recommend consulting a doctor for abnormal results
3. WHEN a user asks about emergency symptoms, THE System SHALL display emergency contact information and recommend immediate medical attention
4. WHEN a user receives treatment instructions, THE System SHALL include a disclaimer that instructions should be confirmed with their doctor
5. WHEN storing medical information, THE System SHALL maintain audit logs of all AI-generated content for compliance and review

### Requirement 19: Low-Resource Mobile Optimization

**User Story:** As a user with a basic smartphone, I want SwasthyaMitra to work smoothly, so that I can access healthcare assistance without expensive devices.

#### Acceptance Criteria

1. WHEN the app is installed, THE System SHALL require minimal storage space (under 50MB for core functionality)
2. WHEN the app is running, THE System SHALL minimize battery consumption through efficient API calls and local caching
3. WHEN the user has limited connectivity, THE System SHALL queue requests and sync when connection is available
4. WHEN the app displays content, THE System SHALL use large, clear icons and minimal text for easy navigation
5. WHEN the app processes audio, THE System SHALL compress audio files before transmission to minimize data usage

### Requirement 20: Accessibility for Low-Literacy Users

**User Story:** As a user with low literacy, I want a simple, intuitive interface, so that I can use SwasthyaMitra without confusion.

#### Acceptance Criteria

1. WHEN the app is opened, THE System SHALL display large, recognizable icons with minimal text labels
2. WHEN a user navigates the app, THE System SHALL use voice guidance and audio feedback for all interactions
3. WHEN the app displays information, THE System SHALL use simple language, short sentences, and visual indicators (colors, icons)
4. WHEN a user makes a mistake, THE System SHALL provide clear, supportive error messages in their native language
5. WHEN the app requires input, THE System SHALL prioritize voice input over text input for all major functions

