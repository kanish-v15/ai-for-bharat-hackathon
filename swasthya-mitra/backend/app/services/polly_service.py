"""Amazon Polly TTS with smart routing: Polly for Hindi/English, Sarvam for other Indian languages."""

import asyncio
import boto3
from app.config import get_settings

settings = get_settings()
polly_client = boto3.client("polly", region_name=settings.aws_region)

# Amazon Polly neural voices for supported Indian languages
POLLY_VOICES = {
    "hindi": {"VoiceId": "Kajal", "Engine": "neural", "LanguageCode": "hi-IN"},
    "english": {"VoiceId": "Kajal", "Engine": "neural", "LanguageCode": "en-IN"},
}

# Languages that have good Polly neural voices
POLLY_SUPPORTED = set(POLLY_VOICES.keys())


async def text_to_speech_polly(text: str, language: str = "hindi") -> bytes:
    """Convert text to speech using Amazon Polly. Returns MP3 bytes."""
    voice_config = POLLY_VOICES.get(language, POLLY_VOICES["english"])

    print(f"[POLLY_TTS] Converting {len(text)} chars, lang={language}, voice={voice_config['VoiceId']}")

    try:
        response = await asyncio.to_thread(
            polly_client.synthesize_speech,
            Text=text,
            OutputFormat="mp3",
            VoiceId=voice_config["VoiceId"],
            Engine=voice_config["Engine"],
            LanguageCode=voice_config["LanguageCode"],
        )

        audio_bytes = response["AudioStream"].read()
        print(f"[POLLY_TTS] Success: {len(audio_bytes)} bytes of audio generated")
        return audio_bytes

    except Exception as e:
        print(f"[POLLY_TTS] Error: {e}")
        raise


async def text_to_speech_smart(text: str, language: str = "hindi") -> tuple[bytes, str]:
    """Smart TTS: Polly for Hindi/English, Sarvam Bulbul for other Indian languages.

    Returns: (audio_bytes, content_type)
    """
    if language in POLLY_SUPPORTED:
        audio = await text_to_speech_polly(text, language)
        return audio, "audio/mpeg"
    else:
        # Fallback to Sarvam Bulbul v3 for Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati
        from app.services.sarvam_service import text_to_speech
        audio = await text_to_speech(text, language)
        return audio, "audio/wav"
