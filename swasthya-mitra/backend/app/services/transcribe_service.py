"""Amazon Transcribe STT service — primary speech-to-text for all features.

Uses batch transcription via S3 for all 9 Indian languages.
Uses Amazon Transcribe Medical for English medical consultations.
"""

import asyncio
import json
import uuid
import boto3
import httpx
from app.config import get_settings

settings = get_settings()
transcribe_client = boto3.client("transcribe", region_name=settings.aws_region)
s3_client = boto3.client("s3", region_name=settings.aws_region)

TRANSCRIBE_LANGUAGES = {
    "hindi": "hi-IN",
    "english": "en-IN",
    "tamil": "ta-IN",
    "telugu": "te-IN",
    "kannada": "kn-IN",
    "malayalam": "ml-IN",
    "bengali": "bn-IN",
    "marathi": "mr-IN",
    "gujarati": "gu-IN",
}


async def speech_to_text(audio_bytes: bytes, language: str = "hindi") -> str:
    """Transcribe audio using Amazon Transcribe (batch mode).

    Uploads audio to S3, starts transcription job, polls for result.
    Typically completes in 5-10 seconds for short audio clips.
    """
    lang_code = TRANSCRIBE_LANGUAGES.get(language, "hi-IN")
    job_name = f"sm-{uuid.uuid4().hex[:16]}"
    s3_key = f"temp/stt/{job_name}.webm"

    print(f"[AWS_TRANSCRIBE] Job {job_name}, {len(audio_bytes)} bytes, lang={lang_code}")

    try:
        # 1. Upload audio to S3
        await asyncio.to_thread(
            s3_client.put_object,
            Bucket=settings.s3_bucket,
            Key=s3_key,
            Body=audio_bytes,
            ContentType="audio/webm",
        )

        s3_uri = f"s3://{settings.s3_bucket}/{s3_key}"

        # 2. Start transcription job
        await asyncio.to_thread(
            transcribe_client.start_transcription_job,
            TranscriptionJobName=job_name,
            Media={"MediaFileUri": s3_uri},
            MediaFormat="webm",
            LanguageCode=lang_code,
        )

        # 3. Poll for completion
        transcript = await _poll_job(job_name)
        print(f"[AWS_TRANSCRIBE] Success: {transcript[:100]}")
        return transcript

    except Exception as e:
        print(f"[AWS_TRANSCRIBE] Error: {e}")
        raise
    finally:
        # Cleanup temp S3 file
        try:
            await asyncio.to_thread(
                s3_client.delete_object,
                Bucket=settings.s3_bucket,
                Key=s3_key,
            )
        except Exception:
            pass
        # Cleanup transcription job
        try:
            await asyncio.to_thread(
                transcribe_client.delete_transcription_job,
                TranscriptionJobName=job_name,
            )
        except Exception:
            pass


async def speech_to_text_medical(audio_bytes: bytes) -> str:
    """Transcribe medical audio using Amazon Transcribe Medical.

    Optimized for medical terminology — drug names, conditions, procedures.
    Currently supports English only (en-US).
    """
    job_name = f"sm-med-{uuid.uuid4().hex[:12]}"
    s3_key = f"temp/stt-med/{job_name}.webm"

    print(f"[AWS_TRANSCRIBE_MED] Job {job_name}, {len(audio_bytes)} bytes")

    try:
        # 1. Upload to S3
        await asyncio.to_thread(
            s3_client.put_object,
            Bucket=settings.s3_bucket,
            Key=s3_key,
            Body=audio_bytes,
            ContentType="audio/webm",
        )

        s3_uri = f"s3://{settings.s3_bucket}/{s3_key}"

        # 2. Start medical transcription
        await asyncio.to_thread(
            transcribe_client.start_medical_transcription_job,
            MedicalTranscriptionJobName=job_name,
            Media={"MediaFileUri": s3_uri},
            MediaFormat="webm",
            LanguageCode="en-US",
            Specialty="PRIMARYCARE",
            Type="DICTATION",
        )

        # 3. Poll for completion
        transcript = await _poll_medical_job(job_name)
        print(f"[AWS_TRANSCRIBE_MED] Success: {transcript[:100]}")
        return transcript

    except Exception as e:
        print(f"[AWS_TRANSCRIBE_MED] Error: {e}")
        raise
    finally:
        try:
            await asyncio.to_thread(
                s3_client.delete_object,
                Bucket=settings.s3_bucket,
                Key=s3_key,
            )
        except Exception:
            pass


async def _poll_job(job_name: str, max_wait: int = 120) -> str:
    """Poll a standard transcription job until complete."""
    for _ in range(max_wait):
        await asyncio.sleep(1)
        status = await asyncio.to_thread(
            transcribe_client.get_transcription_job,
            TranscriptionJobName=job_name,
        )
        job = status["TranscriptionJob"]
        job_status = job["TranscriptionJobStatus"]

        if job_status == "COMPLETED":
            transcript_uri = job["Transcript"]["TranscriptFileUri"]
            return await _fetch_transcript(transcript_uri)
        elif job_status == "FAILED":
            reason = job.get("FailureReason", "Unknown error")
            raise Exception(f"Transcription failed: {reason}")

    raise Exception("Transcription timed out after 120s")


async def _poll_medical_job(job_name: str, max_wait: int = 120) -> str:
    """Poll a medical transcription job until complete."""
    for _ in range(max_wait):
        await asyncio.sleep(1)
        status = await asyncio.to_thread(
            transcribe_client.get_medical_transcription_job,
            MedicalTranscriptionJobName=job_name,
        )
        job = status["MedicalTranscriptionJob"]
        job_status = job["TranscriptionJobStatus"]

        if job_status == "COMPLETED":
            transcript_uri = job["Transcript"]["TranscriptFileUri"]
            return await _fetch_transcript(transcript_uri)
        elif job_status == "FAILED":
            reason = job.get("FailureReason", "Unknown error")
            raise Exception(f"Medical transcription failed: {reason}")

    raise Exception("Medical transcription timed out after 120s")


async def _fetch_transcript(transcript_uri: str) -> str:
    """Fetch and parse the transcript JSON from the Transcribe output URI."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(transcript_uri)
        resp.raise_for_status()
        data = resp.json()

    results = data.get("results", {})
    transcripts = results.get("transcripts", [])
    if transcripts:
        return transcripts[0].get("transcript", "")
    return ""
