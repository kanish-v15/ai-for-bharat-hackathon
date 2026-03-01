# Care Guide - Implementation Guide (Sarmitha)

## Owner: Sarmitha
## Branch: `sarmitha/care-guide`
## Estimated Time: 20-24 hours across 5 days

---

## Feature Summary

Care Guide is a voice-based medical Q&A assistant. Patients speak health questions in Hindi or Tamil and receive:
1. Their question transcribed and displayed
2. An AI-generated medical response in their native language
3. An audio response they can listen to
4. Emergency detection if symptoms are critical

**Flow (Translation Sandwich):**
```
Voice Question (Hindi/Tamil)
  → Sarvam Saarika (STT)
  → Sarvam Mayura (Translate to English)
  → Bedrock Sonnet 4.6 (Medical Q&A)
  → Sarvam Mayura (Translate to Hindi/Tamil)
  → Sarvam Bulbul (TTS)
  → Audio Response
```

---

## Day-by-Day Tasks

### Day 1 (4 hrs): Sarvam AI Integration + Bedrock Prompt

**Task 1.1: Sarvam STT Integration (1.5 hrs)**
- File: `backend/app/services/sarvam_service.py` (shared, add your functions)
- Test `speech_to_text()` with sample Hindi and Tamil audio
- Handle audio formats: WebM (from browser MediaRecorder) and WAV
- If Sarvam expects WAV, add conversion using `pydub` or `ffmpeg`
- Test with:
  - Clean audio (quiet room)
  - Noisy audio (simulate real conditions)
  - Code-mixed speech (Hinglish: "Mera headache bahut zyada hai")

**Task 1.2: Sarvam Translation Integration (1 hr)**
- Test `translate()` with medical sentences:
  - Hindi→English: "मुझे सिरदर्द हो रहा है" → "I am having a headache"
  - Tamil→English: "எனக்கு தலைவலி இருக்கிறது" → "I am having a headache"
  - English→Hindi: "Take 500mg paracetamol twice daily" → Hindi
  - English→Tamil: same → Tamil
- Verify medical terms are preserved correctly

**Task 1.3: Bedrock Medical Q&A Prompt (1.5 hrs)**
- File: `backend/app/prompts/medical_qa.py`
- Write the system prompt:

```python
MEDICAL_QA_SYSTEM_PROMPT = """You are a compassionate healthcare assistant providing general health information to patients in India. Your responses should be:

1. SIMPLE: Use language a person with no medical education can understand
2. SAFE: Never diagnose. Never prescribe specific medications. Always recommend consulting a doctor.
3. STRUCTURED: Organize your response as:
   - What this symptom/condition generally means
   - Common causes
   - General home care suggestions (if safe)
   - When to see a doctor immediately
4. RESPONSIBLE: Always include a disclaimer

Output as JSON:
{
  "answer": "Your detailed response here",
  "emergency_flag": false,
  "emergency_message": "Only if emergency_flag is true - urgent message",
  "when_to_see_doctor": "Clear guidance on when professional help is needed",
  "disclaimer": "This information is for general awareness only. It is not medical advice. Please consult a qualified doctor for proper diagnosis and treatment."
}

EMERGENCY DETECTION - Set emergency_flag=true if the question mentions:
- Chest pain or pressure
- Difficulty breathing or shortness of breath
- Severe bleeding that won't stop
- Sudden numbness or weakness on one side
- Loss of consciousness
- Severe allergic reaction (swelling of face/throat)
- Poisoning or overdose
- Suicidal thoughts or self-harm

If emergency is detected, your emergency_message should say:
"This sounds like it could be a medical emergency. Please call 108 (ambulance) or go to the nearest hospital immediately. Do not wait."
"""
```

### Day 2 (5 hrs): Complete Backend Pipeline

**Task 2.1: Care Guide Router (2 hrs)**
- File: `backend/app/routers/care_guide.py`
- Implement `POST /api/care-guide/ask`:

```python
# Endpoint flow:
# 1. Receive audio blob + language preference
# 2. Call Sarvam Saarika STT → get text in native language
# 3. Display transcribed text to user (for confirmation)
# 4. Call Sarvam Mayura → translate to English
# 5. Call Bedrock Sonnet 4.6 → get medical response in English
# 6. Parse JSON response, check emergency_flag
# 7. Call Sarvam Mayura → translate response to native language
# 8. Call Sarvam Bulbul → generate audio response
# 9. Upload audio to S3
# 10. Save interaction to DynamoDB
# 11. Return: {transcribed_text, response, audio_url, emergency_flag}
```

**Task 2.2: Text Input Fallback (1 hr)**
- Implement `POST /api/care-guide/ask-text`:
  - Same flow but accepts typed text instead of audio
  - Skips STT step, goes directly to translation
  - Important for testing and for users who prefer typing

**Task 2.3: Conversation History (1 hr)**
- Store each Q&A pair in DynamoDB
- Include conversation context in Bedrock prompt for follow-up questions:
  ```
  Previous conversation:
  Q: "What causes headache?"
  A: "Headaches can be caused by..."

  Current question: "What medicine can I take for it?"
  ```
- Limit context to last 3 exchanges to manage token usage

**Task 2.4: Emergency Response Handling (1 hr)**
- When `emergency_flag=true`:
  - Response includes prominent emergency banner
  - Display: "Call 108 immediately" with clickable phone link
  - Audio response starts with emergency message
  - Log emergency interaction for audit
- Test with emergency keywords: "chest pain", "can't breathe", "heavy bleeding"

### Day 3 (5 hrs): Frontend UI

**Task 3.1: Care Guide Page Layout (1.5 hrs)**
- File: `frontend/src/pages/CareGuide.jsx`
- Layout:
  ```
  ┌──────────────────────────────┐
  │  💬 Care Guide               │
  │  "Ask any health question"   │
  ├──────────────────────────────┤
  │                              │
  │  Chat History Area           │
  │  ┌────────────────────────┐  │
  │  │ 🗣️ "Mujhe sar dard    │  │
  │  │     ho raha hai"       │  │
  │  └────────────────────────┘  │
  │  ┌────────────────────────┐  │
  │  │ 🤖 "सिरदर्द कई कारणों │  │
  │  │     से हो सकता है..."  │  │
  │  │                        │  │
  │  │  🔊 [Listen]           │  │
  │  └────────────────────────┘  │
  │                              │
  ├──────────────────────────────┤
  │  ┌──────────────────┐       │
  │  │  🎤 Hold to Speak │       │
  │  └──────────────────┘       │
  │  Or type your question:     │
  │  [___________________][Send] │
  │                              │
  │  ⚠️ Disclaimer              │
  └──────────────────────────────┘
  ```

**Task 3.2: Voice Input Integration (2 hrs)**
- Use the shared `VoiceRecorder.jsx` component
- Two modes:
  - **Push-to-talk**: Hold mic button to record, release to send
  - **Tap-to-toggle**: Tap to start, tap again to stop
- Show recording indicator (pulsing red dot + timer)
- After recording stops:
  1. Show "Transcribing..." loading
  2. Display transcribed text (user sees their question in text)
  3. Show "Thinking..." loading
  4. Display AI response with audio player

**Task 3.3: Chat Interface (1 hr)**
- Chat bubble style: user messages on right (blue), AI on left (gray)
- Each AI response includes:
  - Text response in native language
  - AudioPlayer component
  - "When to see a doctor" section (highlighted)
- Scroll to bottom on new message
- Show conversation history from DynamoDB

**Task 3.4: Emergency Banner (0.5 hrs)**
- When emergency_flag=true:
  - Red full-width banner at top
  - "🚨 EMERGENCY: Call 108 immediately"
  - Clickable phone number: `tel:108`
  - Pulsing animation to draw attention
  - Banner stays visible even when scrolling

### Day 4 (4 hrs): Integration + Polish

**Task 4.1: Connect Frontend to Backend (1.5 hrs)**
- Wire up API calls
- Handle: recording → upload → get response → display
- Handle loading states for each step
- Handle errors gracefully (show retry button)

**Task 4.2: Test Voice Q&A Flow (1.5 hrs)**
- Test questions in Hindi:
  - "मुझे बुखार आ रहा है" (I have fever)
  - "मेरा पेट दर्द कर रहा है" (My stomach hurts)
  - "शुगर की बीमारी में क्या खाना चाहिए" (What to eat in diabetes)
- Test questions in Tamil:
  - "எனக்கு காய்ச்சல் வருகிறது" (I have fever)
  - "வயிற்று வலி இருக்கிறது" (I have stomach pain)
- Test emergency detection:
  - "मुझे सीने में दर्द हो रहा है" (I have chest pain)
- Verify audio responses play correctly

**Task 4.3: Follow-up Questions Test (0.5 hrs)**
- Ask: "What causes headache?"
- Then ask: "What medicine can I take?"
- Verify context is maintained (AI knows you're asking about headache medicine)

**Task 4.4: UI Polish (0.5 hrs)**
- Smooth scroll behavior
- Loading skeleton for chat bubbles
- Responsive on mobile
- Text input keyboard doesn't cover chat area

### Day 5 (3 hrs): Deploy + Final

**Task 5.1: Deploy & Test (1.5 hrs)**
- Deploy backend (Lambda)
- Test live endpoints
- Verify audio recording works on deployed URL (HTTPS required for MediaRecorder)

**Task 5.2: Cross-Browser Testing (0.5 hrs)**
- Test on Chrome (mobile + desktop)
- Test on Safari (if possible)
- Verify microphone permissions work

**Task 5.3: Demo Preparation (1 hr)**
- Prepare 3 demo questions to ask live:
  1. Simple question in Hindi about common symptom
  2. Follow-up question showing conversation memory
  3. Emergency question to show safety features
- Practice the demo flow timing

---

## API Contract

### POST /api/care-guide/ask

**Request:**
```
Content-Type: multipart/form-data

Fields:
- audio: File (WebM/WAV, max 30 seconds)
- language: string ("hindi" | "tamil")
- user_id: string (optional)
- session_id: string (optional, for conversation context)
```

**Response (200):**
```json
{
  "interaction_id": "uuid-string",
  "transcribed_text": "मुझे सिरदर्द हो रहा है",
  "translated_question": "I am having a headache",
  "response": "सिरदर्द कई कारणों से हो सकता है...",
  "response_english": "Headaches can be caused by...",
  "audio_url": "https://s3.amazonaws.com/.../response.mp3",
  "emergency_flag": false,
  "emergency_message": null,
  "when_to_see_doctor": "अगर सिरदर्द 3 दिन से ज़्यादा रहे...",
  "disclaimer": "यह जानकारी सामान्य जागरूकता के लिए है..."
}
```

### POST /api/care-guide/ask-text

**Request:**
```json
{
  "text": "मुझे सिरदर्द हो रहा है",
  "language": "hindi",
  "user_id": "optional",
  "session_id": "optional"
}
```

**Response:** Same as above (minus transcribed_text)

---

## Key Technical Notes

1. **MediaRecorder Format**: Browsers output WebM (Opus codec) by default. Sarvam may need WAV. Either:
   - Convert on frontend using `lamejs` or similar before sending
   - Convert on backend using `pydub` (requires ffmpeg in Lambda layer)
   - Check Sarvam docs - they may accept WebM directly

2. **Recording Duration**: Cap at 30 seconds to prevent huge audio files. Show timer to user.

3. **HTTPS Requirement**: `MediaRecorder` API only works on HTTPS or localhost. The deployed Amplify URL will be HTTPS, so this is fine. But test on localhost during development.

4. **Conversation Context Tokens**: When including conversation history in Bedrock prompt, limit to last 3 exchanges (~2000 tokens). Older context gets summarized using Nova Lite to save costs.

5. **Sarvam STT Latency**: Expect 2-5 seconds for STT. Show "Transcribing your question..." during this time.

6. **Total Response Time Target**: Aim for < 15 seconds total:
   - STT: 2-3 sec
   - Translation: 1 sec
   - Bedrock: 3-5 sec
   - Translation: 1 sec
   - TTS: 2-3 sec

7. **Cost Estimation**:
   - Sarvam STT/TTS/Translate: Free tier
   - Bedrock Sonnet 4.6: ~$0.02 per Q&A
   - Total for 200 test interactions: ~$5-8
