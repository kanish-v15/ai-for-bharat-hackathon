import httpx
from app.config import get_settings

settings = get_settings()

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

HEADERS = {
    "API-Subscription-Key": settings.sarvam_api_key,
}


async def speech_to_text(audio_bytes: bytes, language: str = "hindi") -> str:
    """Transcribe audio using Sarvam Saarika STT."""
    import base64

    lang_code = LANGUAGE_CODES.get(language, "hi-IN")

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            f"{settings.sarvam_api_base}/speech-to-text",
            headers=HEADERS,
            json={
                "input": base64.b64encode(audio_bytes).decode("utf-8"),
                "language_code": lang_code,
                "model": "saarika:v2",
                "with_timestamps": False,
            },
        )
        response.raise_for_status()
        return response.json().get("transcript", "")


async def text_to_speech(text: str, language: str = "hindi") -> bytes:
    """Convert text to speech using Sarvam Bulbul TTS."""
    lang_code = LANGUAGE_CODES.get(language, "hi-IN")

    # Chunk long text (Sarvam has a character limit)
    chunks = _chunk_text(text, max_chars=500)
    all_audio = b""

    async with httpx.AsyncClient(timeout=60) as client:
        for chunk in chunks:
            response = await client.post(
                f"{settings.sarvam_api_base}/text-to-speech",
                headers=HEADERS,
                json={
                    "text": chunk,
                    "target_language_code": lang_code,
                    "model": "bulbul:v3",
                    "speaker": "pooja",
                    "speech_sample_rate": 22050,
                    "enable_preprocessing": True,
                },
            )
            response.raise_for_status()
            data = response.json()
            if "audios" in data and data["audios"]:
                import base64
                all_audio += base64.b64decode(data["audios"][0])

    return all_audio


async def translate_text(text: str, source_lang: str = "english", target_lang: str = "hindi") -> str:
    """Translate text using Sarvam Mayura translation."""
    source_code = LANGUAGE_CODES.get(source_lang, "en-IN")
    target_code = LANGUAGE_CODES.get(target_lang, "hi-IN")

    if source_code == target_code:
        return text

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{settings.sarvam_api_base}/translate",
            headers=HEADERS,
            json={
                "input": text,
                "source_language_code": source_code,
                "target_language_code": target_code,
                "model": "mayura:v1",
                "enable_preprocessing": True,
            },
        )
        response.raise_for_status()
        return response.json().get("translated_text", text)


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
