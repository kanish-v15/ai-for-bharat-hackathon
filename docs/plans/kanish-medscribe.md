# MedScribe - Implementation Guide (Kanish)

## Owner: Kanish
## Branch: `kanish/medscribe`
## Estimated Time: 20-24 hours across 5 days

---

## Feature Summary

MedScribe lets doctors record their consultation in Hindi/Tamil and receive:
1. Transcribed consultation text
2. Auto-generated structured SOAP notes in English
3. Extracted medical entities (medications, dosages, symptoms) with validation
4. Patient instructions translated to native language with audio

**Flow:**
```
Doctor Voice (Hindi/Tamil)
  → S3 (Audio Buffer)
  → Sarvam Saarika (STT)
  → Sarvam Mayura (Translate to English)
  → Bedrock Sonnet 4.6 (SOAP Notes)
  → AWS Comprehend Medical (Entity Extraction)
  → Sarvam Mayura (Patient Instructions → Native Language)
  → Sarvam Bulbul (TTS for Patient)
  → Two Outputs: English Clinical Notes + Regional Patient Instructions
```

---

## Day-by-Day Tasks

### Day 1 (4 hrs): SOAP Note Generation + Comprehend Medical

**Task 1.1: Bedrock SOAP Notes Prompt (2 hrs)**
- File: `backend/app/prompts/soap_notes.py`
- Write the system prompt:

```python
SOAP_NOTES_SYSTEM_PROMPT = """You are a medical documentation assistant. Generate structured SOAP notes from the following doctor-patient consultation transcript.

The transcript may be in a mix of English and transliterated regional language. Extract the clinical information and organize it professionally.

Output as JSON:
{
  "soap_note": {
    "subjective": "Patient's reported symptoms, history, and complaints in clinical language",
    "objective": "Physical examination findings, vital signs, observable clinical data mentioned",
    "assessment": "Clinical impression, working diagnosis based on the consultation",
    "plan": "Treatment plan including medications, dosages, follow-up schedule, referrals"
  },
  "patient_instructions": "Simple, clear instructions for the patient covering: what medicines to take, when to take them, what to avoid, when to come back, warning signs to watch for",
  "medications": [
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "frequency": "Twice daily",
      "duration": "5 days",
      "route": "Oral",
      "notes": "Take after food"
    }
  ],
  "follow_up": "Follow-up visit in 1 week",
  "referrals": ["None" or list of specialist referrals],
  "red_flags": ["Warning signs patient should watch for"]
}

IMPORTANT:
- Use standard medical terminology in SOAP notes (these are for hospital records)
- Patient instructions should be in SIMPLE language (these go to the patient)
- If transcript is unclear about a medication or dosage, flag it with "[VERIFY]"
- Do not invent clinical information not present in the transcript
- If a SOAP section has no relevant information, write "Not discussed in this consultation"
"""
```

- Test with sample consultation transcripts (prepare 2-3 mock transcripts)

**Task 1.2: Comprehend Medical Integration (2 hrs)**
- File: `backend/app/services/comprehend_service.py`
- Implement `extract_medical_entities(text)`:
  - Call `comprehend_medical.detect_entities_v2(Text=text)`
  - Parse response for: MEDICATION, DOSAGE, STRENGTH, FREQUENCY, SYMPTOM, DIAGNOSIS
  - Implement `validate_entities()`:
    - Flag entities with confidence < 0.7
    - Cross-check: if Bedrock extracted a medication, verify Comprehend also found it
    - Flag mismatches for doctor review
- Test with sample SOAP notes

### Day 2 (5 hrs): Complete Backend Pipeline

**Task 2.1: MedScribe Router (2.5 hrs)**
- File: `backend/app/routers/medscribe.py`
- Implement `POST /api/medscribe/process`:

```python
# Endpoint flow:
# 1. Receive audio file (longer recording, up to 10 minutes) + language
# 2. Upload audio to S3 (consultations/{doctor_id}/{interaction_id}/)
# 3. Call Sarvam Saarika STT → get transcribed text in native language
# 4. Call Sarvam Mayura → translate to English
# 5. Call Bedrock Sonnet 4.6 → generate SOAP notes
# 6. Call Comprehend Medical → extract and validate entities
# 7. Merge Bedrock medications + Comprehend entities, flag mismatches
# 8. Generate patient instructions from SOAP Plan section
# 9. Call Sarvam Mayura → translate patient instructions to native language
# 10. Call Sarvam Bulbul → generate audio instructions for patient
# 11. Upload audio to S3
# 12. Save everything to DynamoDB
# 13. Return: {transcript, soap_notes, entities, patient_instructions, audio_url}
```

**Task 2.2: Long Audio Handling (1 hr)**
- Consultations can be 5-10 minutes long
- Sarvam STT may have limits on audio length
- Strategy: Split audio into 60-second chunks, transcribe each, concatenate text
- Use `pydub` for audio splitting:
  ```python
  from pydub import AudioSegment
  audio = AudioSegment.from_file(audio_bytes)
  chunks = [audio[i:i+60000] for i in range(0, len(audio), 60000)]
  ```

**Task 2.3: Entity Validation & Doctor Review (1 hr)**
- Compare medications from Bedrock SOAP vs Comprehend Medical
- If Bedrock says "Paracetamol 500mg" but Comprehend says "Paracetamol" (no dosage) → flag
- If Comprehend finds an entity Bedrock missed → add it with "[AUTO-DETECTED]" tag
- Mark any entity with confidence < 0.7 as `flagged: true`
- Doctor should see flagged entities highlighted in yellow for review

**Task 2.4: Patient Instructions Pipeline (0.5 hrs)**
- Extract the `plan` section from SOAP notes
- Simplify using Bedrock or Nova Lite:
  ```
  "Convert this treatment plan into simple patient instructions
   that a person with no medical knowledge can understand.
   Include: what medicine, when to take, what to avoid, when to come back."
  ```
- Translate to native language via Sarvam Mayura
- Generate audio via Sarvam Bulbul

### Day 3 (5 hrs): Frontend UI

**Task 3.1: MedScribe Page Layout (1.5 hrs)**
- File: `frontend/src/pages/MedScribe.jsx`
- Layout (Doctor View):
  ```
  ┌──────────────────────────────┐
  │  📋 MedScribe                │
  │  "Auto-generate clinical notes"│
  ├──────────────────────────────┤
  │                              │
  │  ┌────────────────────────┐  │
  │  │   🎤 Record            │  │
  │  │   Consultation         │  │
  │  │   [00:00]              │  │
  │  │                        │  │
  │  │  [Start] [Stop]        │  │
  │  └────────────────────────┘  │
  │                              │
  ├──── After Processing ────────┤
  │                              │
  │  📝 Transcript               │
  │  "Doctor ne kaha ki..."      │
  │  [Show/Hide]                 │
  │                              │
  │  📋 SOAP Notes               │
  │  ┌──────────────────────┐    │
  │  │ S: Patient reports...│    │
  │  │ O: Temp 101°F...     │    │
  │  │ A: Viral fever...    │    │
  │  │ P: Paracetamol 500mg │    │
  │  └──────────────────────┘    │
  │  [Edit SOAP Notes]           │
  │                              │
  │  💊 Medications              │
  │  ┌──────────────────────┐    │
  │  │ ✅ Paracetamol 500mg │    │
  │  │    Twice daily, 5 days│   │
  │  │ ⚠️ [VERIFY] Amoxici..│    │
  │  │    Dosage unclear     │    │
  │  └──────────────────────┘    │
  │                              │
  │  👤 Patient Instructions     │
  │  "आपको दिन में दो बार..."   │
  │  🔊 [Play for Patient]      │
  │                              │
  │  [Print] [Save] [New]        │
  └──────────────────────────────┘
  ```

**Task 3.2: Recording Interface (1.5 hrs)**
- Extended recording (up to 10 minutes, not 30 seconds like Care Guide)
- Show timer: 00:00 → 10:00
- Visual waveform or pulsing indicator during recording
- Pause/Resume capability
- Show audio file size estimate
- Large Stop button (prominent, red)

**Task 3.3: SOAP Notes Display (1 hr)**
- Four collapsible sections: S, O, A, P
- Each section is editable (contentEditable or textarea)
- Doctor can modify before saving
- Highlight any "[VERIFY]" tags in yellow
- "Save Changes" button after editing

**Task 3.4: Medications & Entity Display (0.5 hrs)**
- List of extracted medications in card format
- Each card shows: name, dosage, frequency, duration, route
- Flagged entities have yellow warning icon + "Please verify" text
- Doctor can edit/confirm each entity

**Task 3.5: Patient Instructions Section (0.5 hrs)**
- Translated instructions in native language
- AudioPlayer to play instructions aloud (doctor can play it for patient)
- Print button (opens browser print dialog with just the instructions)
- Clear, large text formatting

### Day 4 (4 hrs): Integration + Polish

**Task 4.1: Connect Frontend to Backend (1.5 hrs)**
- Wire up recording → upload → process → display flow
- Handle the longer processing time (10-30 seconds for full consultation)
- Step-by-step progress:
  1. "Uploading recording..."
  2. "Transcribing consultation..."
  3. "Generating clinical notes..."
  4. "Extracting medications..."
  5. "Creating patient instructions..."
  6. "Generating audio..."

**Task 4.2: Test with Sample Consultations (1.5 hrs)**
- Test with 3 scenarios:
  1. **Simple fever**: Doctor describes symptoms, prescribes paracetamol
  2. **Diabetes follow-up**: Doctor reviews sugar levels, adjusts medication
  3. **Multi-medication**: Doctor prescribes 3+ medicines with specific instructions
- Verify:
  - SOAP notes are structured correctly
  - All medications are extracted
  - Patient instructions are clear and translated
  - Audio plays correctly

**Task 4.3: Edit & Save Flow (0.5 hrs)**
- Doctor edits SOAP notes → saves → DynamoDB updated
- Doctor confirms/corrects flagged entities → saved
- Test the edit → save cycle

**Task 4.4: Print Functionality (0.5 hrs)**
- Print button generates clean printable view:
  - SOAP notes (English) for hospital records
  - Patient instructions (native language) for patient
- Use `@media print` CSS for clean output
- Hide navigation, buttons, etc. in print view

### Day 5 (3 hrs): Deploy + Final

**Task 5.1: Deploy & Test (1.5 hrs)**
- Deploy backend with increased Lambda timeout (30 sec → 120 sec for MedScribe)
- MedScribe processes longer audio, needs more time
- Test on deployed URL

**Task 5.2: Lambda Configuration (0.5 hrs)**
- Memory: 512MB minimum (audio processing needs more RAM)
- Timeout: 120 seconds (consultation processing is longer)
- Add ffmpeg Lambda Layer if needed for audio conversion

**Task 5.3: Demo Preparation (1 hr)**
- Prepare a demo consultation script (30-60 seconds):
  ```
  "Patient aayi hai, 35 saal ki female, 3 din se bukhar hai,
  102 degree temperature, sar dard, badan dard, khansi bhi hai.
  Check kiya toh throat red hai, tonsils swollen hain.
  Viral fever lag raha hai. Paracetamol 500mg do baar dena hai,
  5 din tak. Zyada paani piyo. Agar 3 din mein theek nahi ho
  toh wapas aana."
  ```
- Practice recording this and verifying output
- Time the entire processing pipeline

---

## API Contract

### POST /api/medscribe/process

**Request:**
```
Content-Type: multipart/form-data

Fields:
- audio: File (WebM/WAV, max 10 minutes / 20MB)
- language: string ("hindi" | "tamil")
- doctor_id: string (optional)
- patient_id: string (optional)
```

**Response (200):**
```json
{
  "interaction_id": "uuid-string",
  "transcript": {
    "original": "Doctor ne kaha ki patient ko bukhar hai...",
    "english": "Doctor said the patient has fever..."
  },
  "soap_note": {
    "subjective": "35-year-old female presents with 3-day history of fever (102°F), headache, body ache, and cough.",
    "objective": "Throat erythema noted. Tonsils swollen bilaterally.",
    "assessment": "Viral upper respiratory tract infection.",
    "plan": "Paracetamol 500mg PO BID x 5 days. Increase fluid intake. Follow up in 3 days if symptoms persist."
  },
  "medications": [
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "frequency": "Twice daily",
      "duration": "5 days",
      "route": "Oral",
      "confidence": 0.95,
      "flagged": false
    }
  ],
  "entities": [
    {"type": "SYMPTOM", "value": "Fever", "confidence": 0.98},
    {"type": "SYMPTOM", "value": "Headache", "confidence": 0.95},
    {"type": "DIAGNOSIS", "value": "Viral URTI", "confidence": 0.88},
    {"type": "MEDICATION", "value": "Paracetamol", "confidence": 0.97}
  ],
  "patient_instructions": {
    "english": "Take Paracetamol 500mg twice daily after food for 5 days...",
    "translated": "पैरासिटामोल 500mg दिन में दो बार खाना खाने के बाद...",
    "audio_url": "https://s3.amazonaws.com/.../instructions.mp3"
  },
  "flagged_items": ["None or list of items needing doctor verification"],
  "follow_up": "3 days if symptoms persist"
}
```

### PUT /api/medscribe/update/{interaction_id}

**Request (Doctor edits SOAP notes):**
```json
{
  "soap_note": {
    "subjective": "Updated text...",
    "objective": "Updated text...",
    "assessment": "Updated text...",
    "plan": "Updated text..."
  },
  "confirmed_medications": [
    {"name": "Paracetamol", "dosage": "500mg", "confirmed": true}
  ]
}
```

**Response (200):**
```json
{
  "status": "updated",
  "interaction_id": "uuid-string"
}
```

---

## Key Technical Notes

1. **Lambda Timeout**: MedScribe processes longer audio (up to 10 min). Set Lambda timeout to 120 seconds minimum. If processing takes longer, consider:
   - Async processing: return interaction_id immediately, frontend polls for status
   - Or split into two calls: upload+transcribe first, then process

2. **Audio Chunking**: Sarvam STT likely has a per-request audio length limit (check docs). Split long audio into 60-second chunks:
   ```python
   # Each chunk transcribed separately, results concatenated
   full_transcript = " ".join([sarvam_stt(chunk) for chunk in chunks])
   ```

3. **Comprehend Medical Region**: Comprehend Medical is only available in `us-east-1` and `us-west-2`. If your main region is `ap-south-1`, you'll need a cross-region call:
   ```python
   comprehend_client = boto3.client('comprehendmedical', region_name='us-east-1')
   ```

4. **ffmpeg in Lambda**: If you need audio format conversion (WebM → WAV), add an ffmpeg Lambda Layer. Pre-built layers are available on GitHub.

5. **SOAP Note Quality**: The quality of SOAP notes depends heavily on transcript quality. If the transcription is poor, SOAP notes will be poor. Show the transcript to the doctor first so they can correct before generating notes.

6. **Cost Estimation**:
   - Bedrock Sonnet 4.6: ~$0.05 per consultation (longer prompts)
   - Comprehend Medical: ~$0.01 per request
   - Sarvam: Free tier
   - Total for 50 test consultations: ~$5-8

7. **Print Layout**: Use a separate CSS file for print:
   ```css
   @media print {
     .no-print { display: none; }
     .soap-section { page-break-inside: avoid; }
     body { font-size: 12pt; }
   }
   ```
