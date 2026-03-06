"""Unit tests for Sarvam AI service functions."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.sarvam_service import (
    speech_to_text, text_to_speech, translate_text, _chunk_text, LANGUAGE_CODES,
)


# ─── _chunk_text tests ───

class TestChunkText:
    def test_short_text_returns_single_chunk(self):
        result = _chunk_text("Hello world", max_chars=500)
        assert result == ["Hello world"]

    def test_empty_text_returns_single_chunk(self):
        result = _chunk_text("", max_chars=500)
        assert result == [""]

    def test_exact_limit_returns_single_chunk(self):
        text = "a" * 500
        result = _chunk_text(text, max_chars=500)
        assert result == [text]

    def test_long_text_splits_at_period(self):
        text = "First sentence. Second sentence. Third sentence."
        result = _chunk_text(text, max_chars=30)
        assert len(result) >= 2
        # All original content should be preserved
        joined = " ".join(result)
        assert "First sentence" in joined
        assert "Third sentence" in joined

    def test_hindi_sentence_split(self):
        text = "पहला वाक्य। दूसरा वाक्य। तीसरा वाक्य।"
        result = _chunk_text(text, max_chars=30)
        assert len(result) >= 2

    def test_no_sentence_boundary_still_chunks(self):
        text = "a" * 1000
        result = _chunk_text(text, max_chars=500)
        # Without sentence boundaries, it stays as one chunk
        assert len(result) == 1

    def test_multiple_sentences_grouped_within_limit(self):
        text = "Short. Also short. Tiny."
        result = _chunk_text(text, max_chars=500)
        assert len(result) == 1


# ─── LANGUAGE_CODES tests ───

class TestLanguageCodes:
    def test_all_9_languages_present(self):
        expected = ["hindi", "tamil", "english", "telugu", "kannada", "malayalam", "bengali", "marathi", "gujarati"]
        for lang in expected:
            assert lang in LANGUAGE_CODES, f"Missing language: {lang}"

    def test_codes_are_bcp47_format(self):
        for lang, code in LANGUAGE_CODES.items():
            assert "-" in code, f"Code for {lang} should be BCP-47 format: {code}"
            assert code.endswith("-IN"), f"Code for {lang} should end with -IN: {code}"


# ─── speech_to_text tests (mocked) ───

class TestSpeechToText:
    @pytest.mark.asyncio
    async def test_successful_transcription(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"transcript": "Hello patient"}

        with patch("app.services.sarvam_service.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            result = await speech_to_text(b"fake_audio_bytes", "english")
            assert result == "Hello patient"

            # Verify the API call was made with correct params
            call_args = mock_client.post.call_args
            assert "speech-to-text" in call_args[0][0]
            files = call_args[1]["files"]
            assert "file" in files
            assert files["model"] == (None, "saaras:v3")
            assert files["language_code"] == (None, "en-IN")
            assert files["mode"] == (None, "transcribe")

    @pytest.mark.asyncio
    async def test_error_raises_with_details(self):
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = '{"error": "Invalid audio format"}'

        with patch("app.services.sarvam_service.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            with pytest.raises(Exception, match="Sarvam STT error 400"):
                await speech_to_text(b"bad_audio", "hindi")

    @pytest.mark.asyncio
    async def test_default_language_is_hindi(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"transcript": "नमस्ते"}

        with patch("app.services.sarvam_service.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            await speech_to_text(b"audio")
            files = mock_client.post.call_args[1]["files"]
            assert files["language_code"] == (None, "hi-IN")

    @pytest.mark.asyncio
    async def test_unknown_language_defaults_to_hindi(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"transcript": "test"}

        with patch("app.services.sarvam_service.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            await speech_to_text(b"audio", "unknown_lang")
            files = mock_client.post.call_args[1]["files"]
            assert files["language_code"] == (None, "hi-IN")


# ─── translate_text tests (mocked) ───

class TestTranslateText:
    @pytest.mark.asyncio
    async def test_same_language_returns_original(self):
        result = await translate_text("Hello", "english", "english")
        assert result == "Hello"

    @pytest.mark.asyncio
    async def test_translation_call(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"translated_text": "नमस्ते"}
        mock_response.raise_for_status = MagicMock()

        with patch("app.services.sarvam_service.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            result = await translate_text("Hello", "english", "hindi")
            assert result == "नमस्ते"

            call_args = mock_client.post.call_args
            body = call_args[1]["json"]
            assert body["source_language_code"] == "en-IN"
            assert body["target_language_code"] == "hi-IN"
            assert body["model"] == "mayura:v1"


# ─── text_to_speech tests (mocked) ───

class TestTextToSpeech:
    @pytest.mark.asyncio
    async def test_tts_returns_audio_bytes(self):
        import base64
        fake_audio = base64.b64encode(b"fake_wav_data").decode()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"audios": [fake_audio]}
        mock_response.raise_for_status = MagicMock()

        with patch("app.services.sarvam_service.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            result = await text_to_speech("Hello", "english")
            assert result == b"fake_wav_data"

    @pytest.mark.asyncio
    async def test_tts_empty_response(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"audios": []}
        mock_response.raise_for_status = MagicMock()

        with patch("app.services.sarvam_service.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            result = await text_to_speech("Hello", "hindi")
            assert result == b""
