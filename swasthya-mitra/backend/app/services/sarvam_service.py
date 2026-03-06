import asyncio
import base64
import io
import os
import tempfile

from sarvamai import SarvamAI
from app.config import get_settings

settings = get_settings()

client = SarvamAI(api_subscription_key=settings.sarvam_api_key)

LANGUAGE_CODES = {
    "hindi": "hi-IN",
    "tamil": "ta-IN",
    "english": "en-IN",
    "telugu": "te-IN",
    "kannada": "kn-IN",
    "malayalam": "ml-IN",
    "bengali": "bn-IN",
    "marathi": "mr-IN",
    "gujarati": "gu-IN",
}

# Max duration per chunk for Sarvam STT (25s to stay under 30s limit)
CHUNK_DURATION_MS = 25_000


def _get_ffmpeg_path():
    """Get ffmpeg path from imageio-ffmpeg package."""
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return None


def _split_audio_chunks(audio_bytes: bytes, chunk_ms: int = CHUNK_DURATION_MS) -> list[bytes]:
    """Split audio into chunks of max `chunk_ms` milliseconds using pydub.

    Returns list of audio byte chunks in webm/wav format.
    Falls back to returning the original audio if splitting fails.
    """
    ffmpeg_path = _get_ffmpeg_path()
    if not ffmpeg_path:
        print("[SARVAM_STT] No ffmpeg available, cannot chunk audio")
        return [audio_bytes]

    try:
        from pydub import AudioSegment

        # Set ffmpeg path for pydub
        AudioSegment.converter = ffmpeg_path
        AudioSegment.ffprobe = ffmpeg_path.replace("ffmpeg", "ffprobe")

        # Write input bytes to temp file
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp_in:
            tmp_in.write(audio_bytes)
            tmp_in_path = tmp_in.name

        try:
            audio = AudioSegment.from_file(tmp_in_path)
            duration_ms = len(audio)
            print(f"[SARVAM_STT] Audio duration: {duration_ms / 1000:.1f}s")

            if duration_ms <= chunk_ms:
                return [audio_bytes]

            chunks = []
            for start in range(0, duration_ms, chunk_ms):
                end = min(start + chunk_ms, duration_ms)
                segment = audio[start:end]

                # Export chunk as wav (universally supported)
                buf = io.BytesIO()
                segment.export(buf, format="wav")
                chunks.append(buf.getvalue())

            print(f"[SARVAM_STT] Split into {len(chunks)} chunks of ~{chunk_ms / 1000:.0f}s each")
            return chunks

        finally:
            os.unlink(tmp_in_path)

    except Exception as e:
        print(f"[SARVAM_STT] Audio splitting failed: {e}, sending as-is")
        return [audio_bytes]


async def speech_to_text(audio_bytes: bytes, language: str = "hindi") -> str:
    """Transcribe audio using Sarvam Saaras v3 STT.

    Automatically chunks audio >25s into segments to avoid the 30s limit.
    Supports recordings of any duration (doctor consultations up to 10+ minutes).
    """
    lang_code = LANGUAGE_CODES.get(language, "hi-IN")

    print(f"[SARVAM_STT] Transcribing {len(audio_bytes)} bytes, lang={lang_code}")

    # Split long audio into chunks
    chunks = await asyncio.to_thread(_split_audio_chunks, audio_bytes)

    all_transcripts = []
    for i, chunk_bytes in enumerate(chunks):
        try:
            file_ext = "wav" if chunk_bytes[:4] == b"RIFF" else "webm"
            file_obj = io.BytesIO(chunk_bytes)
            file_obj.name = f"audio_chunk_{i}.{file_ext}"

            print(f"[SARVAM_STT] Chunk {i + 1}/{len(chunks)}: {len(chunk_bytes)} bytes")

            response = await asyncio.to_thread(
                client.speech_to_text.transcribe,
                file=file_obj,
                model="saaras:v3",
                mode="transcribe",
                language_code=lang_code,
            )

            transcript = response.transcript or ""
            if transcript.strip():
                all_transcripts.append(transcript.strip())
                print(f"[SARVAM_STT] Chunk {i + 1}: {transcript[:80]}")

        except Exception as e:
            print(f"[SARVAM_STT] Chunk {i + 1} error: {e}")
            # Continue with other chunks even if one fails

    full_transcript = " ".join(all_transcripts)
    print(f"[SARVAM_STT] Full transcript ({len(full_transcript)} chars): {full_transcript[:150]}")
    return full_transcript


async def text_to_speech(text: str, language: str = "hindi") -> bytes:
    """Convert text to speech using Sarvam Bulbul v3 TTS via the official SDK."""
    lang_code = LANGUAGE_CODES.get(language, "hi-IN")

    chunks = _chunk_text(text, max_chars=500)
    all_audio = b""

    print(f"[SARVAM_TTS] Converting {len(text)} chars in {len(chunks)} chunk(s), lang={lang_code}")

    try:
        for i, chunk in enumerate(chunks):
            print(f"[SARVAM_TTS] Processing chunk {i + 1}/{len(chunks)} ({len(chunk)} chars)")

            response = await asyncio.to_thread(
                client.text_to_speech.convert,
                text=chunk,
                target_language_code=lang_code,
                model="bulbul:v3",
                speaker="pooja",
                speech_sample_rate=22050,
                enable_preprocessing=True,
            )

            if response.audios:
                for audio_b64 in response.audios:
                    all_audio += base64.b64decode(audio_b64)

        print(f"[SARVAM_TTS] Success: {len(all_audio)} bytes of audio generated")
        return all_audio

    except Exception as e:
        print(f"[SARVAM_TTS] Error: {e}")
        raise


async def translate_text(text: str, source_lang: str = "english", target_lang: str = "hindi") -> str:
    """Translate text using Sarvam Mayura v1 translation via the official SDK."""
    source_code = LANGUAGE_CODES.get(source_lang, "en-IN")
    target_code = LANGUAGE_CODES.get(target_lang, "hi-IN")

    if source_code == target_code:
        return text

    print(f"[SARVAM_TRANSLATE] Translating {len(text)} chars from {source_code} to {target_code}")

    try:
        response = await asyncio.to_thread(
            client.text.translate,
            input=text,
            source_language_code=source_code,
            target_language_code=target_code,
            model="mayura:v1",
            enable_preprocessing=True,
        )

        translated = response.translated_text or text
        print(f"[SARVAM_TRANSLATE] Success: {translated[:100]}")
        return translated

    except Exception as e:
        print(f"[SARVAM_TRANSLATE] Error: {e}")
        raise


def _chunk_text(text: str, max_chars: int = 500) -> list[str]:
    """Split text into chunks at sentence boundaries."""
    if len(text) <= max_chars:
        return [text]

    chunks = []
    current = ""
    for sentence in text.replace("। ", "।\n").replace(". ", ".\n").split("\n"):
        if len(current) + len(sentence) + 1 > max_chars and current:
            chunks.append(current.strip())
            current = sentence
        else:
            current += " " + sentence if current else sentence
    if current.strip():
        chunks.append(current.strip())
    return chunks
