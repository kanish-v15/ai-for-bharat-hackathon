"""Amazon Comprehend Medical — extract medical entities from text.

Detects medications, conditions, treatments, anatomy, test/procedure names
with confidence scores. Used in MedScribe and Lab Samjho.
"""

import asyncio
import boto3
from app.config import get_settings

settings = get_settings()
comprehend_medical = boto3.client("comprehendmedical", region_name=settings.aws_region)


async def detect_entities(text: str) -> list[dict]:
    """Detect medical entities in text using Amazon Comprehend Medical.

    Returns list of entities with: text, category, type, score, traits.

    Categories: MEDICATION, MEDICAL_CONDITION, ANATOMY, TEST_TREATMENT_PROCEDURE,
                PROTECTED_HEALTH_INFORMATION, TIME_EXPRESSION
    """
    if not text or not text.strip():
        return []

    print(f"[COMPREHEND_MED] Detecting entities in {len(text)} chars")

    try:
        response = await asyncio.to_thread(
            comprehend_medical.detect_entities_v2,
            Text=text[:20000],  # API limit is 20,000 characters
        )

        entities = []
        for entity in response.get("Entities", []):
            entities.append({
                "text": entity.get("Text", ""),
                "category": entity.get("Category", ""),
                "type": entity.get("Type", ""),
                "score": round(entity.get("Score", 0), 3),
                "traits": [
                    {"name": t.get("Name", ""), "score": round(t.get("Score", 0), 3)}
                    for t in entity.get("Traits", [])
                ],
                "attributes": [
                    {
                        "type": a.get("Type", ""),
                        "text": a.get("Text", ""),
                        "score": round(a.get("Score", 0), 3),
                    }
                    for a in entity.get("Attributes", [])
                ],
            })

        print(f"[COMPREHEND_MED] Found {len(entities)} entities")
        return entities

    except Exception as e:
        print(f"[COMPREHEND_MED] Error: {e}")
        return []


async def extract_medications(text: str) -> list[dict]:
    """Extract medications with dosage, frequency, route from text.

    Returns structured medication objects.
    """
    entities = await detect_entities(text)

    medications = []
    for entity in entities:
        if entity["category"] == "MEDICATION":
            med = {
                "name": entity["text"],
                "confidence": entity["score"],
            }
            # Extract attributes (dosage, frequency, route, etc.)
            for attr in entity.get("attributes", []):
                attr_type = attr["type"].lower()
                if attr_type == "dosage":
                    med["dosage"] = attr["text"]
                elif attr_type == "frequency":
                    med["frequency"] = attr["text"]
                elif attr_type == "route_or_mode":
                    med["route"] = attr["text"]
                elif attr_type == "duration":
                    med["duration"] = attr["text"]
                elif attr_type == "strength":
                    med["strength"] = attr["text"]
                elif attr_type == "form":
                    med["form"] = attr["text"]

            # Check for negation trait
            for trait in entity.get("traits", []):
                if trait["name"] == "NEGATION" and trait["score"] > 0.7:
                    med["negated"] = True

            medications.append(med)

    return medications


async def extract_conditions(text: str) -> list[dict]:
    """Extract medical conditions/diagnoses from text."""
    entities = await detect_entities(text)

    conditions = []
    for entity in entities:
        if entity["category"] == "MEDICAL_CONDITION":
            cond = {
                "name": entity["text"],
                "type": entity["type"],  # DX_NAME, SYMPTOM, SIGN
                "confidence": entity["score"],
            }
            # Check traits
            for trait in entity.get("traits", []):
                if trait["name"] == "NEGATION" and trait["score"] > 0.7:
                    cond["negated"] = True
                elif trait["name"] == "DIAGNOSIS" and trait["score"] > 0.7:
                    cond["is_diagnosis"] = True
                elif trait["name"] == "SYMPTOM" and trait["score"] > 0.7:
                    cond["is_symptom"] = True

            conditions.append(cond)

    return conditions


async def detect_phi(text: str) -> list[dict]:
    """Detect Protected Health Information (PHI) in text.

    Returns list of PHI entities (names, dates, phone numbers, etc.)
    Useful for data de-identification.
    """
    if not text or not text.strip():
        return []

    try:
        response = await asyncio.to_thread(
            comprehend_medical.detect_phi,
            Text=text[:20000],
        )

        phi_entities = []
        for entity in response.get("Entities", []):
            phi_entities.append({
                "text": entity.get("Text", ""),
                "type": entity.get("Type", ""),
                "category": entity.get("Category", ""),
                "score": round(entity.get("Score", 0), 3),
                "begin_offset": entity.get("BeginOffset"),
                "end_offset": entity.get("EndOffset"),
            })

        return phi_entities

    except Exception as e:
        print(f"[COMPREHEND_MED] PHI detection error: {e}")
        return []
