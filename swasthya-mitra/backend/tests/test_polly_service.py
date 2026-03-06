"""Unit tests for Amazon Polly TTS service."""
import pytest
from unittest.mock import MagicMock, patch, AsyncMock


# ─── text_to_speech_polly tests ───

class TestTextToSpeechPolly:
    @pytest.mark.asyncio
    async def test_hindi_uses_kajal_neural(self):
        mock_stream = MagicMock()
        mock_stream.read.return_value = b"fake_mp3_audio"
        mock_response = {"AudioStream": mock_stream}

        with patch("app.services.polly_service.polly_client") as mock_client:
            mock_client.synthesize_speech.return_value = mock_response

            from app.services.polly_service import text_to_speech_polly
            result = await text_to_speech_polly("नमस्ते", "hindi")

            assert result == b"fake_mp3_audio"
            call_kwargs = mock_client.synthesize_speech.call_args
            assert call_kwargs[1]["VoiceId"] == "Kajal"
            assert call_kwargs[1]["Engine"] == "neural"
            assert call_kwargs[1]["LanguageCode"] == "hi-IN"

    @pytest.mark.asyncio
    async def test_english_uses_kajal_neural(self):
        mock_stream = MagicMock()
        mock_stream.read.return_value = b"fake_mp3"
        mock_response = {"AudioStream": mock_stream}

        with patch("app.services.polly_service.polly_client") as mock_client:
            mock_client.synthesize_speech.return_value = mock_response

            from app.services.polly_service import text_to_speech_polly
            result = await text_to_speech_polly("Hello", "english")

            assert result == b"fake_mp3"
            call_kwargs = mock_client.synthesize_speech.call_args
            assert call_kwargs[1]["LanguageCode"] == "en-IN"

    @pytest.mark.asyncio
    async def test_polly_error_raises(self):
        with patch("app.services.polly_service.polly_client") as mock_client:
            mock_client.synthesize_speech.side_effect = Exception("Polly Error")

            from app.services.polly_service import text_to_speech_polly
            with pytest.raises(Exception, match="Polly Error"):
                await text_to_speech_polly("Hello", "hindi")


# ─── text_to_speech_smart tests ───

class TestTextToSpeechSmart:
    @pytest.mark.asyncio
    async def test_hindi_uses_polly(self):
        mock_stream = MagicMock()
        mock_stream.read.return_value = b"polly_audio"
        mock_response = {"AudioStream": mock_stream}

        with patch("app.services.polly_service.polly_client") as mock_client:
            mock_client.synthesize_speech.return_value = mock_response

            from app.services.polly_service import text_to_speech_smart
            audio, content_type = await text_to_speech_smart("नमस्ते", "hindi")

            assert audio == b"polly_audio"
            assert content_type == "audio/mpeg"
            mock_client.synthesize_speech.assert_called_once()

    @pytest.mark.asyncio
    async def test_english_uses_polly(self):
        mock_stream = MagicMock()
        mock_stream.read.return_value = b"polly_audio"
        mock_response = {"AudioStream": mock_stream}

        with patch("app.services.polly_service.polly_client") as mock_client:
            mock_client.synthesize_speech.return_value = mock_response

            from app.services.polly_service import text_to_speech_smart
            audio, content_type = await text_to_speech_smart("Hello", "english")

            assert audio == b"polly_audio"
            assert content_type == "audio/mpeg"

    @pytest.mark.asyncio
    async def test_tamil_uses_sarvam_fallback(self):
        with patch("app.services.polly_service.polly_client") as mock_polly, \
             patch("app.services.sarvam_service.text_to_speech") as mock_sarvam:
            mock_sarvam.return_value = b"sarvam_audio"

            from app.services.polly_service import text_to_speech_smart
            audio, content_type = await text_to_speech_smart("வணக்கம்", "tamil")

            assert audio == b"sarvam_audio"
            assert content_type == "audio/wav"
            mock_polly.synthesize_speech.assert_not_called()
            mock_sarvam.assert_called_once()

    @pytest.mark.asyncio
    async def test_telugu_uses_sarvam_fallback(self):
        with patch("app.services.sarvam_service.text_to_speech") as mock_sarvam:
            mock_sarvam.return_value = b"sarvam_audio"

            from app.services.polly_service import text_to_speech_smart
            audio, content_type = await text_to_speech_smart("నమస్కారం", "telugu")

            assert audio == b"sarvam_audio"
            assert content_type == "audio/wav"
