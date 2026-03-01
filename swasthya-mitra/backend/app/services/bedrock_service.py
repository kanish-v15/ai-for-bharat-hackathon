import json
import boto3
from app.config import get_settings

settings = get_settings()
client = boto3.client("bedrock-runtime", region_name=settings.aws_region)


def invoke_claude(prompt: str, system: str = "", max_tokens: int = 4096) -> str:
    """Invoke Claude Sonnet 4.6 via Bedrock for medical reasoning."""
    messages = [{"role": "user", "content": prompt}]

    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "messages": messages,
    }
    if system:
        body["system"] = system

    response = client.invoke_model(
        modelId=settings.bedrock_model_id,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(body),
    )

    result = json.loads(response["body"].read())
    return result["content"][0]["text"]


def invoke_claude_with_image(prompt: str, image_bytes: bytes, media_type: str, system: str = "") -> str:
    """Invoke Claude with an image (for lab report analysis)."""
    import base64

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": image_b64,
                    },
                },
                {"type": "text", "text": prompt},
            ],
        }
    ]

    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "messages": messages,
    }
    if system:
        body["system"] = system

    response = client.invoke_model(
        modelId=settings.bedrock_model_id,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(body),
    )

    result = json.loads(response["body"].read())
    return result["content"][0]["text"]


def invoke_nova_lite(prompt: str, system: str = "") -> str:
    """Invoke Amazon Nova Lite for lighter tasks (translation, formatting)."""
    messages = [{"role": "user", "content": [{"text": prompt}]}]

    body = {
        "messages": messages,
        "inferenceConfig": {"maxTokens": 2048},
    }
    if system:
        body["system"] = [{"text": system}]

    response = client.invoke_model(
        modelId=settings.bedrock_lite_model_id,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(body),
    )

    result = json.loads(response["body"].read())
    return result["output"]["message"]["content"][0]["text"]
