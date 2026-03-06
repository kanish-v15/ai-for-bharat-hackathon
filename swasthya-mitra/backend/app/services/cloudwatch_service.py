"""Amazon CloudWatch structured logging and metrics.

Provides structured JSON logging that CloudWatch Logs Insights can query,
plus custom CloudWatch metrics for monitoring.
"""

import asyncio
import json
import logging
import sys
import time
from datetime import datetime, timezone
from typing import Optional
import boto3
from app.config import get_settings

settings = get_settings()
cloudwatch_client = boto3.client("cloudwatch", region_name=settings.aws_region)

NAMESPACE = "SwasthyaMitra"


# ── Structured Logger ───────────────────────────────────────────────

class StructuredLogger:
    """JSON-formatted logger for CloudWatch Logs Insights queries."""

    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        if not self.logger.handlers:
            handler = logging.StreamHandler(sys.stdout)
            handler.setFormatter(JsonFormatter())
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)

    def info(self, message: str, **kwargs):
        self.logger.info(message, extra={"structured": kwargs})

    def error(self, message: str, **kwargs):
        self.logger.error(message, extra={"structured": kwargs})

    def warning(self, message: str, **kwargs):
        self.logger.warning(message, extra={"structured": kwargs})


class JsonFormatter(logging.Formatter):
    """Format log records as JSON for CloudWatch Logs Insights."""

    def format(self, record):
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "environment": settings.environment,
        }
        structured = getattr(record, "structured", None)
        if structured:
            log_entry.update(structured)
        return json.dumps(log_entry, default=str)


# Pre-configured loggers for each feature
lab_logger = StructuredLogger("swasthyamitra.lab_samjho")
care_logger = StructuredLogger("swasthyamitra.care_guide")
medscribe_logger = StructuredLogger("swasthyamitra.medscribe")
auth_logger = StructuredLogger("swasthyamitra.auth")
api_logger = StructuredLogger("swasthyamitra.api")


# ── CloudWatch Metrics ──────────────────────────────────────────────

async def put_metric(
    metric_name: str,
    value: float = 1,
    unit: str = "Count",
    dimensions: Optional[dict] = None,
):
    """Publish a custom metric to CloudWatch."""
    metric_data = {
        "MetricName": metric_name,
        "Value": value,
        "Unit": unit,
        "Timestamp": datetime.now(timezone.utc),
    }
    if dimensions:
        metric_data["Dimensions"] = [
            {"Name": k, "Value": v} for k, v in dimensions.items()
        ]

    try:
        await asyncio.to_thread(
            cloudwatch_client.put_metric_data,
            Namespace=NAMESPACE,
            MetricData=[metric_data],
        )
    except Exception as e:
        print(f"[CLOUDWATCH] Metric error (non-fatal): {e}")


# ── Convenience Functions ───────────────────────────────────────────

async def track_request(feature: str, language: str, latency_ms: float):
    """Track an API request with feature, language, and latency."""
    await put_metric(
        "RequestCount",
        dimensions={"Feature": feature, "Language": language},
    )
    await put_metric(
        "Latency",
        value=latency_ms,
        unit="Milliseconds",
        dimensions={"Feature": feature},
    )


async def track_error(feature: str, error_type: str):
    """Track an error occurrence."""
    await put_metric(
        "ErrorCount",
        dimensions={"Feature": feature, "ErrorType": error_type},
    )


async def track_stt_usage(service: str, language: str, audio_bytes: int):
    """Track STT usage (Transcribe vs Sarvam)."""
    await put_metric(
        "STTRequest",
        dimensions={"Service": service, "Language": language},
    )
    await put_metric(
        "AudioBytesProcessed",
        value=audio_bytes,
        unit="Bytes",
        dimensions={"Service": service},
    )


async def track_tts_usage(service: str, language: str, text_chars: int):
    """Track TTS usage (Polly vs Sarvam)."""
    await put_metric(
        "TTSRequest",
        dimensions={"Service": service, "Language": language},
    )
    await put_metric(
        "TextCharsProcessed",
        value=text_chars,
        unit="Count",
        dimensions={"Service": service},
    )
