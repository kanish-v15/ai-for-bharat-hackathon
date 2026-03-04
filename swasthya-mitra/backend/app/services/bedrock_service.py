import json
import base64
import boto3
from app.config import get_settings

settings = get_settings()
client = boto3.client("bedrock-runtime", region_name=settings.aws_region)


def invoke_model(prompt: str, system: str = "", max_tokens: int = 4096) -> str:
    """Invoke Amazon Nova Lite for text generation."""
    print(f"[BEDROCK] invoke_model called with model_id={settings.bedrock_model_id}, region={settings.aws_region}")
    messages = [{"role": "user", "content": [{"text": prompt}]}]

    body = {
        "messages": messages,
        "inferenceConfig": {"maxTokens": max_tokens},
    }
    if system:
        body["system"] = [{"text": system}]

    response = client.invoke_model(
        modelId=settings.bedrock_model_id,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(body),
    )

    result = json.loads(response["body"].read())
    return result["output"]["message"]["content"][0]["text"]


def invoke_model_with_image(prompt: str, image_bytes: bytes, media_type: str, system: str = "") -> str:
    """Invoke Amazon Nova Lite with image input."""
    fmt_map = {"image/jpeg": "jpeg", "image/png": "png", "image/gif": "gif", "image/webp": "webp"}
    img_format = fmt_map.get(media_type, "png")
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "image": {
                        "format": img_format,
                        "source": {"bytes": image_b64},
                    }
                },
                {"text": prompt},
            ],
        }
    ]

    body = {
        "messages": messages,
        "inferenceConfig": {"maxTokens": 4096},
    }
    if system:
        body["system"] = [{"text": system}]

    response = client.invoke_model(
        modelId=settings.bedrock_model_id,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(body),
    )

    result = json.loads(response["body"].read())
    return result["output"]["message"]["content"][0]["text"]
