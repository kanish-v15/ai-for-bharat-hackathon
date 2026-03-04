from pydantic import BaseModel
from typing import Optional


class LabParameter(BaseModel):
    name: str
    value: str
    unit: str
    reference_range: str
    classification: str  # Normal, Borderline, Abnormal
    explanation: str
    explanation_translated: Optional[str] = None


class LabAnalysisResponse(BaseModel):
    parameters: list[LabParameter]
    summary: str
    audio_url: Optional[str] = None
    interaction_id: str


class LabQuestionRequest(BaseModel):
    question: str
    analysis_context: str  # JSON string of the analysis result
    language: str = "hindi"


class CareGuideTextRequest(BaseModel):
    text: str
    language: str = "hindi"
    user_id: str = "demo-user"
    session_id: Optional[str] = None


class CareGuideResponse(BaseModel):
    answer: str
    answer_translated: Optional[str] = None
    transcription: Optional[str] = None
    audio_url: Optional[str] = None
    is_emergency: bool = False
    session_id: str


class SOAPNote(BaseModel):
    subjective: str
    objective: str
    assessment: str
    plan: str


class Medication(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None


class MedScribeTextRequest(BaseModel):
    text: str
    language: str = "hindi"
    doctor_id: str = "demo-doctor"


class MedScribeResponse(BaseModel):
    transcription: str
    soap_note: SOAPNote
    medications: list[Medication]
    patient_instructions: str
    patient_instructions_translated: Optional[str] = None
    patient_audio_url: Optional[str] = None
    interaction_id: str
