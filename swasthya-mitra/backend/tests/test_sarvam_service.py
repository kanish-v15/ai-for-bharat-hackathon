"""Unit tests for Sarvam AI service functions (SDK-based)."""
import pytest
from unittest.mock import MagicMock, patch
from app.services.sarvam_service import (
    speech_to_text, text_to_speech, translate_text, _chunk_text, LANGUAGE_CODES,
)


# ─── _chunk_text tests ───

class TestChunkText:
    def test_short_text_returns_single_chunk(self):
        assert _chunk_text("Hello world", max_chars=500) == ["Hello world"]

    def test_empty_text_returns_single_chunk(self):
        assert _chunk_text("", max_chars=500) == [""]

    def test_exact_limit_returns_single_chunk(self):
        text = "a" * 500
        assert _chunk_text(text, max_chars=500) == [text]

    def test_long_text_splits_at_period(self):
        text = "First sentence. Second sentence. Third sentence."
        result = _chunk_text(text, max_chars=30)
        assert len(result) >= 2
        joined = " ".join(result)
        assert "First sentence" in joined
        assert "Third sentence" in joined

    def test_hindi_sentence_split(self):
        text = "पहला वाक्य। दूसरा वाक्य। तीसरा वाक्य।"
        result = _chunk_text(text, max_chars=30)
        assert len(result) >= 2

    def test_no_sentence_boundary_stays_single(self):
        text = "a" * 1000
        result = _chunk_text(text, max_chars=500)
        assert len(result) == 1

    def test_multiple_sentences_grouped_within_limit(self):
        text = "Short. Also short. Tiny."
        assert len(_chunk_text(text, max_chars=500)) == 1


# ─── LANGUAGE_CODES tests ───

class TestLanguageCodes:
    def test_all_9_languages_present(self):
        expected = ["hindi", "tamil", "english", "telugu", "kannada", "malayalam", "bengali", "marathi", "gujarati"]
        for lang in expected:
            assert lang in LANGUAGE_CODES

    def test_codes_are_bcp47_format(self):
        for lang, code in LANGUAGE_CODES.items():
            assert "-" in code and code.endswith("-IN"), f"Bad code for {lang}: {code}"


# ─── speech_to_text tests (SDK mocked) ───

class TestSpeechToText:
    @pytest.mark.asyncio
    async def test_successful_transcription(self):
        mock_response = MagicMock()
        mock_response.transcript = "Hello patient"

        with patch("app.services.sarvam_service.client") as mock_client:
            mock_client.speech_to_text.transcribe.return_value = mock_response

            result = await speech_to_text(b"fake_audio_bytes", "english")
            assert result == "Hello patient"

            call_kwargs = mock_client.speech_to_text.transcribe.call_args
            assert call_kwargs is not None

    @pytest.mark.asyncio
    async def test_error_raises(self):
        with patch("app.services.sarvam_service.client") as mock_client:
            mock_client.speech_to_text.transcribe.side_effect = Exception("API Error")

            with pytest.raises(Exception, match="API Error"):
                await speech_to_text(b"bad_audio", "hindi")

    @pytest.mark.asyncio
    async def test_empty_transcript_returns_empty(self):
        mock_response = MagicMock()
        mock_response.transcript = None

        with patch("app.services.sarvam_service.client") as mock_client:
            mock_client.speech_to_text.transcribe.return_value = mock_response
            result = await speech_to_text(b"audio")
            assert result == ""


# ─── translate_text tests (SDK mocked) ───

class TestTranslateText:
    @pytest.mark.asyncio
    async def test_same_language_returns_original(self):
        result = await translate_text("Hello", "english", "english")
        assert result == "Hello"

    @pytest.mark.asyncio
    async def test_translation_call(self):
        mock_response = MagicMock()
        mock_response.translated_text = "नमस्ते"

        with patch("app.services.sarvam_service.client") as mock_client:
            mock_client.text.translate.return_value = mock_response
            result = await translate_text("Hello", "english", "hindi")
            assert result == "नमस्ते"


# ─── text_to_speech tests (SDK mocked) ───

class TestTextToSpeech:
    @pytest.mark.asyncio
    async def test_tts_returns_audio_bytes(self):
        import base64
        fake_audio = base64.b64encode(b"fake_wav_data").decode()
        mock_response = MagicMock()
        mock_response.audios = [fake_audio]

        with patch("app.services.sarvam_service.client") as mock_client:
            mock_client.text_to_speech.convert.return_value = mock_response
            result = await text_to_speech("Hello", "english")
            assert result == b"fake_wav_data"

    @pytest.mark.asyncio
    async def test_tts_empty_response(self):
        mock_response = MagicMock()
        mock_response.audios = []

        with patch("app.services.sarvam_service.client") as mock_client:
            mock_client.text_to_speech.convert.return_value = mock_response
            result = await text_to_speech("Hello", "hindi")
            assert result == b""
