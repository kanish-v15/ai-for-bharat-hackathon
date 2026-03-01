import uuid
import boto3
from app.config import get_settings

settings = get_settings()
client = boto3.client("s3", region_name=settings.aws_region)


def upload_file(file_bytes: bytes, prefix: str, extension: str = "webm") -> str:
    """Upload a file to S3 and return the key."""
    key = f"{prefix}/{uuid.uuid4().hex}.{extension}"

    content_types = {
        "webm": "audio/webm",
        "wav": "audio/wav",
        "mp3": "audio/mpeg",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "pdf": "application/pdf",
    }

    client.put_object(
        Bucket=settings.s3_bucket,
        Key=key,
        Body=file_bytes,
        ContentType=content_types.get(extension, "application/octet-stream"),
    )
    return key


def get_presigned_url(key: str, expires_in: int = 3600) -> str:
    """Generate a presigned URL for an S3 object."""
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": key},
        ExpiresIn=expires_in,
    )


def upload_audio_and_get_url(audio_bytes: bytes, prefix: str) -> str:
    """Upload audio bytes to S3 and return a presigned URL."""
    key = upload_file(audio_bytes, prefix, extension="wav")
    return get_presigned_url(key)
