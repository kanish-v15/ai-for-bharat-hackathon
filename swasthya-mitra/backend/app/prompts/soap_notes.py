MEDSCRIBE_SYSTEM = """You are a medical documentation assistant for Indian doctors.
You convert doctor-patient consultation transcriptions into structured SOAP notes.
You are precise, thorough, and follow standard medical documentation practices."""

MEDSCRIBE_PROMPT = """Convert the following doctor-patient consultation transcription into structured SOAP notes.

Transcription:
{transcription}

Return your response as valid JSON in this exact format:
{{
  "soap_note": {{
    "subjective": "Patient's complaints, symptoms, history as described by the patient...",
    "objective": "Examination findings, vital signs, test results mentioned by the doctor...",
    "assessment": "Doctor's assessment, diagnosis or differential diagnosis...",
    "plan": "Treatment plan, medications prescribed, follow-up instructions..."
  }},
  "medications": [
    {{
      "name": "Medication name",
      "dosage": "e.g., 500mg",
      "frequency": "e.g., twice daily after meals"
    }}
  ],
  "patient_instructions": "Simple instructions for the patient in 3-5 bullet points. Include: when to take medicines, dietary advice, when to come back, warning signs to watch for."
}}

IMPORTANT:
- If information for a section is not available in the transcription, write "Not discussed in consultation"
- Extract ALL medications mentioned with exact dosages
- Patient instructions should be simple enough for a person with basic education
- Use standard medical terminology in SOAP notes but simple language in patient instructions"""

PATIENT_INSTRUCTIONS_TRANSLATE = """Translate these patient instructions to {language}.
Keep them very simple and easy to understand. Use bullet points.

Instructions:
{text}"""
