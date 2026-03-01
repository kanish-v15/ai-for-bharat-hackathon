# SwasthyaMitra - 10 Minute Pitch Script

## Pitch Flow

| Time | Section | Duration |
|------|---------|----------|
| 0:00 | The Problem | 1:30 |
| 1:30 | Why Now | 1:00 |
| 2:30 | Our Solution | 1:00 |
| 3:30 | Live Demo | 3:00 |
| 6:30 | Tech Architecture | 1:00 |
| 7:30 | Market & Integration | 1:00 |
| 8:30 | Responsible AI | 0:30 |
| 9:00 | Vision & Impact | 1:00 |

---

## 0:00-1:30 — THE PROBLEM (Emotional Hook)

> "Imagine you're Lakshmi, a 55-year-old woman from a village near Madurai. She just got her blood test results. The paper is full of English words she can't read. Numbers she doesn't understand. She doesn't know if she's healthy or dying.
>
> This is not a rare story. This is the reality for **90% of India.**
>
> **90% of Indians cannot read their own medical reports** — because they're written in English, a language most Indians don't speak.
>
> Here are three numbers that should worry all of us:"

**SLIDE: Three Stats**
- **2 minutes** — Average doctor consultation time in Indian public hospitals
- **55 million** — Indians pushed into poverty EVERY YEAR because of healthcare costs
- **80%** — Specialist shortage in rural India

> "The problem isn't that India lacks healthcare infrastructure. India has built world-class digital health systems — ABDM, eSanjeevani, PM-JAY.
>
> **The problem is the last mile. The gap between the system and the people.**"

---

## 1:30-2:30 — WHY NOW (The Opportunity)

> "But here's what's changed:"

**SLIDE: The Opportunity**
- 900 million smartphones in India
- World's cheapest mobile data ($0.17/GB)
- 600 million ABHA digital health IDs created
- 170 million teleconsultations on eSanjeevani
- UPI proved that 1.4 billion Indians WILL adopt technology when the interface is right

> "The infrastructure is ready. The smartphones are in people's hands. What's missing is a **voice** — something that speaks their language, literally."

---

## 2:30-3:30 — OUR SOLUTION

> "We built **SwasthyaMitra** — one app, three critical solutions."

**SLIDE: Three Features**

> "**Lab Samjho**: Take a photo of your lab report. Hear what it means in Hindi or Tamil. Green means normal. Red means see a doctor.
>
> **Care Guide**: Ask any health question using your voice. Get an AI-powered answer spoken back to you in your language.
>
> **MedScribe**: Doctors speak naturally during consultation. AI generates structured SOAP notes in English and patient instructions in the patient's language.
>
> All voice-first. All multilingual. All designed for Bharat."

---

## 3:30-6:30 — LIVE DEMO (3 minutes, tight)

### Demo 1: Lab Samjho (60 seconds)
> "Let me show you Lab Samjho in action."

1. Open the app, select Hindi
2. Upload a real lab report image
3. Show loading: "Reading your report... Analyzing... Translating..."
4. Results appear with green/red/yellow indicators
5. Tap "Listen" — Hindi audio plays explaining the results
6. Point out the disclaimer

> "In 15 seconds, Lakshmi now understands her lab report. No doctor visit needed for the explanation."

### Demo 2: Care Guide (60 seconds)
> "Now let me ask a health question in Tamil."

1. Switch language to Tamil
2. Tap mic, speak: "எனக்கு தலைவலி இருக்கிறது" (I have a headache)
3. Show transcription appearing
4. Show AI response in Tamil
5. Play audio response
6. Show "When to see a doctor" section

> "Voice in, voice out. No typing. No English. No literacy required."

### Demo 3: MedScribe (60 seconds)
> "Now the doctor's side. Watch what happens when a doctor speaks naturally."

1. Switch to MedScribe
2. Play or speak a sample consultation in Hindi
3. Show processing: "Transcribing... Generating notes..."
4. SOAP notes appear in structured English
5. Show extracted medications with validation
6. Show patient instructions in Hindi with audio

> "What used to take 15 minutes of documentation now takes 15 seconds. The doctor gets structured English notes for the hospital. The patient gets clear instructions in their language."

---

## 6:30-7:30 — TECH ARCHITECTURE

**SLIDE: Architecture Diagram**

> "SwasthyaMitra is built on a hybrid AI architecture:
>
> **AWS Bedrock with Claude Sonnet 4.6** for medical reasoning — analyzing lab reports, answering health questions, generating SOAP notes.
>
> **Amazon Textract** for reading lab reports. **Amazon Comprehend Medical** for extracting and validating medications.
>
> **Sarvam AI** — built by IIT Madras researchers — for the best Indian language voice experience. Their speech-to-text and text-to-speech handles Hindi, Tamil, and 8 more Indian languages with natural prosody.
>
> All running serverless on **AWS Lambda, API Gateway, S3, and DynamoDB**. Pay-as-you-go. Zero idle cost. Scales to millions."

---

## 7:30-8:30 — MARKET & GOVERNMENT INTEGRATION

**SLIDE: Competitive Gap**

> "We analyzed every major healthtech app in India — Practo, 1mg, Eka Care, Apollo 24/7. **Not a single one** offers voice-first interaction in Indian languages. Not one explains lab reports. Not one provides a multilingual AI medical scribe.
>
> SwasthyaMitra isn't just another health app. It's the **accessibility layer** India's health infrastructure is missing."

**SLIDE: Government Integration**

> "We don't compete with government systems. We **multiply** them:
> - Pull ABHA health records and explain them in voice
> - Pre-triage patients before eSanjeevani teleconsultations
> - Help PM-JAY beneficiaries understand their coverage
> - Replace manual DOTS observation for TB patients with voice follow-ups
>
> India built the digital health highway. **SwasthyaMitra is the auto-rickshaw that takes every citizen to their destination.**"

---

## 8:30-9:00 — RESPONSIBLE AI

> "We take AI safety seriously:
> - **Every response includes a medical disclaimer** — we never replace doctors
> - **Emergency detection** — if you mention chest pain or breathing difficulty, we show 108 immediately
> - **Doctor verification** — MedScribe flags uncertain medications for doctor review
> - **Bias consideration** — we tested across Hindi and Tamil, urban and rural speech patterns
> - **Privacy** — health data is encrypted, consent-based, aligned with India's DPDP Act"

---

## 9:00-10:00 — VISION & IMPACT

> "Let me leave you with this:
>
> **Every lab report explained saves one unnecessary clinic visit.** Average cost: Rs 500. At India's scale — that's billions in savings.
>
> **Every doctor using MedScribe gets back 2-3 hours daily.** That's 20-30 more patients seen.
>
> **Every voice question answered is one less person making a health decision based on WhatsApp forwards.**
>
> SwasthyaMitra doesn't require a smartphone upgrade. Doesn't require English literacy. Doesn't require a doctor in every village.
>
> It requires exactly what 900 million Indians already have — **a phone and a voice.**
>
> Thank you."

---

## Q&A Preparation

### Likely Questions & Answers:

**Q: "How accurate is the lab report analysis?"**
> "We use Claude Sonnet 4.6 on Bedrock which has strong medical reasoning. But we're conservative — every output includes a disclaimer to consult a doctor. We classify as Borderline when uncertain rather than giving a false Normal reading."

**Q: "What about hallucination risk?"**
> "Three safeguards: 1) We constrain outputs to JSON schemas. 2) For MedScribe, we cross-validate Bedrock's medication extraction with Comprehend Medical. 3) Every output is flagged for human review — we never auto-finalize clinical notes."

**Q: "Why Sarvam AI instead of just AWS Polly?"**
> "Amazon Polly has neural voices for Hindi but only standard voices for Tamil and other languages — they sound robotic. Sarvam AI was built by IIT Madras researchers specifically for Indian languages. The voice quality difference is night and day. We use AWS for everything else — Bedrock, Textract, Lambda, S3, DynamoDB."

**Q: "How does this scale?"**
> "100% serverless on AWS. Lambda scales automatically. We pay per request. Zero idle cost. Adding a new language is just a configuration change — Sarvam supports 10+ Indian languages."

**Q: "What about offline capability?"**
> "The current prototype requires internet. For production, we'd cache common health information locally and queue requests when offline, syncing when connection returns. The web app itself loads under 2MB."

**Q: "How is this different from just asking ChatGPT?"**
> "Three reasons: 1) Voice-first — no typing required for low-literacy users. 2) Indian language voice quality — ChatGPT doesn't speak Tamil naturally. 3) Medical safety guardrails — emergency detection, disclaimers, doctor verification loops. We're not a general chatbot, we're a healthcare-specific assistant."

**Q: "What's your business model?"**
> "B2G: Partner with state health departments to deploy at HWCs and PHCs. B2B: License MedScribe to hospital chains for doctor documentation. B2C: Freemium model for patients, premium for unlimited history and family tracking."
