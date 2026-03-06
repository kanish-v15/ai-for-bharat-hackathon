"""Amazon Translate service — primary translation for all features.

Replaces Sarvam Translate with AWS-native translation.
Supports all 9 Indian languages bidirectionally.
"""

import asyncio
import boto3
from app.config import get_settings

settings = get_settings()
translate_client = boto3.client("translate", region_name=settings.aws_region)

# Amazon Translate language codes
TRANSLATE_CODES = {
    "hindi": "hi",
    "english": "en",
    "tamil": "ta",
    "telugu": "te",
    "kannada": "kn",
    "malayalam": "ml",
    "bengali": "bn",
    "marathi": "mr",
    "gujarati": "gu",
}


async def translate_text(
    text: str,
    source_lang: str = "english",
    target_lang: str = "hindi",
) -> str:
    """Translate text using Amazon Translate.

    Args:
        text: Text to translate
        source_lang: Source language name (e.g., 'english', 'hindi')
        target_lang: Target language name

    Returns:
        Translated text string
    """
    source_code = TRANSLATE_CODES.get(source_lang, "en")
    target_code = TRANSLATE_CODES.get(target_lang, "hi")

    # Short-circuit if same language
    if source_code == target_code:
        return text

    if not text or not text.strip():
        return text

    print(f"[AWS_TRANSLATE] {len(text)} chars, {source_code} -> {target_code}")

    try:
        response = await asyncio.to_thread(
            translate_client.translate_text,
            Text=text,
            SourceLanguageCode=source_code,
            TargetLanguageCode=target_code,
        )

        translated = response.get("TranslatedText", text)
        print(f"[AWS_TRANSLATE] Success: {translated[:100]}")
        return translated

    except Exception as e:
        print(f"[AWS_TRANSLATE] Error: {e}")
        # Return original text on failure rather than crashing
        return text
