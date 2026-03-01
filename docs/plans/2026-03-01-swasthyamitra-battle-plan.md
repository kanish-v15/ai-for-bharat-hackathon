# SwasthyaMitra - Hackathon Battle Plan

## Team Techjays | AI for Bharat Hackathon | AWS

---

## Mission
Ship a working prototype of SwasthyaMitra (web app) with all 3 features real and functional. Win the hackathon.

## Team

| Person | Role | Feature | Branch |
|--------|------|---------|--------|
| **Saravana** | Team Lead | Lab Samjho | `saravana/lab-samjho` |
| **Sarmitha** | Developer | Care Guide | `sarmitha/care-guide` |
| **Kanish** | Developer | MedScribe | `kanish/medscribe` |
| **Claude** | AI Assistant | Foundation + Support | `main` (scaffolding) |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) + TailwindCSS |
| Backend | Python FastAPI on AWS Lambda (Mangum) |
| LLM (Heavy) | AWS Bedrock - Claude Sonnet 4.6 |
| LLM (Light) | AWS Bedrock - Amazon Nova Lite |
| OCR | AWS Textract |
| Medical NLP | AWS Comprehend Medical |
| STT | Sarvam AI - Saarika |
| TTS | Sarvam AI - Bulbul |
| Translation | Sarvam AI - Mayura |
| Database | AWS DynamoDB |
| Storage | AWS S3 |
| Compute | AWS Lambda + API Gateway |
| Hosting | AWS Amplify |

## Languages: Hindi + Tamil + English

---

## Day-by-Day Schedule

### Day 1: Foundation (6 hrs)

| Time | Saravana | Sarmitha | Kanish | Claude |
|------|----------|----------|--------|--------|
| Hr 1-2 | Set up AWS account, enable Bedrock models, create S3 bucket + DynamoDB table | Set up Sarvam AI account, test STT/TTS APIs | Set up dev environment, clone repo | Scaffold entire project (React + FastAPI + shared components) |
| Hr 3-4 | Test Textract with sample lab report | Test Sarvam STT with Hindi/Tamil audio | Test Comprehend Medical with sample text | Write shared services (bedrock, sarvam, s3, dynamodb) |
| Hr 5-6 | Start Lab Samjho backend | Start Care Guide backend | Start MedScribe backend | Support + code review |

**Day 1 Deliverable:** Project scaffolded, all AWS/Sarvam services tested individually

### Day 2: Backend Core (6 hrs)

| Time | Saravana | Sarmitha | Kanish |
|------|----------|----------|--------|
| Hr 1-3 | Textract integration + Bedrock lab analysis prompt | Sarvam STT + Translation + Bedrock medical Q&A prompt | Sarvam STT + Bedrock SOAP notes prompt |
| Hr 4-6 | Lab Samjho API endpoint complete (upload → OCR → analyze → translate → audio) | Care Guide API endpoint complete (voice → STT → translate → LLM → translate → TTS) | MedScribe API endpoint complete (voice → STT → translate → SOAP → entities → translate → TTS) |

**Day 2 Deliverable:** All 3 backend APIs working (tested via Postman/curl)

### Day 3: Frontend (6 hrs)

| Time | Saravana | Sarmitha | Kanish |
|------|----------|----------|--------|
| Hr 1-3 | Lab Samjho UI (upload, results, color-coded cards) | Care Guide UI (voice recorder, chat interface) | MedScribe UI (recorder, SOAP display, medications) |
| Hr 4-6 | Connect Lab Samjho frontend to backend | Connect Care Guide frontend to backend | Connect MedScribe frontend to backend |

**Day 3 Deliverable:** All 3 features working end-to-end on localhost

### Day 4: Test + Fix (6 hrs)

| Time | Saravana | Sarmitha | Kanish |
|------|----------|----------|--------|
| Hr 1-2 | Test with 3+ real lab reports | Test voice Q&A in Hindi + Tamil | Test with 3 mock consultations |
| Hr 3-4 | Fix bugs, handle edge cases | Fix bugs, test emergency detection | Fix bugs, test entity validation |
| Hr 5-6 | Landing page + Home screen | Error handling + loading states | Disclaimers + print functionality |

**Day 4 Deliverable:** All features tested, bugs fixed, UI polished

### Day 5: Deploy + Ship (4 hrs)

| Time | Saravana | Sarmitha | Kanish |
|------|----------|----------|--------|
| Hr 1-2 | Deploy backend (Lambda + API Gateway) | Deploy frontend (Amplify) | Test deployed URL on mobile |
| Hr 3-4 | Final end-to-end test on live URL | Cross-browser testing | README + code cleanup |

**Day 5 Deliverable:** Live URL working, code pushed to GitHub

### Day 6: Pitch Prep (2 hrs)

| Time | Everyone |
|------|----------|
| Hr 1 | Practice pitch 3 times, time it, refine |
| Hr 2 | Record backup demo video, prepare Q&A answers |

**Day 6 Deliverable:** Pitch rehearsed, demo video recorded as backup

---

## Critical Path & Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Sarvam API down | No voice in/out | Keep AWS Polly/Transcribe as fallback |
| Bedrock model not enabled | No AI reasoning | Enable model access Day 1, takes minutes |
| Lambda timeout | MedScribe fails | Set timeout to 120s, use async processing |
| Textract poor OCR | Lab Samjho fails | Test with 5+ report formats early |
| Audio format issues | Recording doesn't work | Test MediaRecorder on Day 1, add ffmpeg if needed |
| HTTPS for mic access | Mic doesn't work on deployed app | Amplify provides HTTPS by default |
| Budget overrun ($100) | Services stop | Monitor costs daily via AWS Cost Explorer |

---

## Budget Breakdown (Estimated)

| Service | Estimated Cost |
|---------|---------------|
| Bedrock (Sonnet 4.6) | $15-25 (500 test interactions) |
| Bedrock (Nova Lite) | $2-5 |
| Textract | $2-3 (200 pages) |
| Comprehend Medical | $1-2 |
| S3 | $0.50 |
| DynamoDB | $0.50 (on-demand) |
| Lambda | $1-2 |
| API Gateway | $0.50 |
| Amplify Hosting | Free tier |
| **Total AWS** | **~$25-40** |
| Sarvam AI | Free tier |
| **Grand Total** | **~$25-40 (well within $100)** |

---

## Implementation Docs

Each team member should read their specific doc:

1. **[Shared Foundation](shared-foundation.md)** — Everyone reads this (project structure, shared services, setup)
2. **[Lab Samjho - Saravana](saravana-lab-samjho.md)** — Full implementation guide with day-by-day tasks
3. **[Care Guide - Sarmitha](sarmitha-care-guide.md)** — Full implementation guide with day-by-day tasks
4. **[MedScribe - Kanish](kanish-medscribe.md)** — Full implementation guide with day-by-day tasks
5. **[Pitch Script](pitch-script.md)** — 10-minute pitch script with Q&A prep

---

## Winning Strategy

### What judges want (from judging criteria):
1. **Clarity** → Simple story: "Voice-first health AI for Indians who can't read English"
2. **Usefulness** → Real user friction solved, not hypothetical
3. **Technical Depth** → Bedrock + Textract + Comprehend Medical + Sarvam = meaningful AI
4. **Responsibility** → Disclaimers, emergency detection, doctor verification, bias consideration
5. **Viability** → Works on basic phones, low bandwidth, integrates with govt infra

### Our competitive edge:
- **Zero competitors** combine all 3 features with voice-first + multilingual
- **Government integration story** — last mile layer for ABDM, PM-JAY, eSanjeevani
- **Real working prototype** — not slides, not mockups
- **India-built AI** — Sarvam AI from IIT Madras + AWS global infrastructure

### The one line the jury remembers:
> *"India built the digital health highway. SwasthyaMitra is the auto-rickshaw that takes every citizen to their destination."*
