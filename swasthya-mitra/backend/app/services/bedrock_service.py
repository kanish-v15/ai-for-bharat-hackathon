import json
import boto3
from app.config import get_settings

settings = get_settings()
client = boto3.client("bedrock-runtime", region_name=settings.aws_region)


def invoke_claude(prompt: str, system: str = "", max_tokens: int = 4096) -> str:
    """Invoke Claude via Bedrock, with automatic fallback to Nova Lite."""
    print(f"[BEDROCK] invoke_claude called with model_id={settings.bedrock_model_id}, region={settings.aws_region}")
    try:
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
    except client.exceptions.AccessDeniedException as e:
        print(f"[BEDROCK] Claude access denied, falling back to Nova Lite: {e}")
        return invoke_nova_lite(prompt, system)
    except Exception as e:
        if "AccessDeniedException" in str(type(e).__name__) or "AccessDenied" in str(e):
            print(f"[BEDROCK] Claude access denied (generic), falling back to Nova Lite: {e}")
            return invoke_nova_lite(prompt, system)
        raise


def invoke_claude_with_image(prompt: str, image_bytes: bytes, media_type: str, system: str = "") -> str:
    """Invoke Claude with an image, with fallback to Nova Lite (text-only)."""
    import base64

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    try:
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
    except Exception as e:
        if "AccessDenied" in str(type(e).__name__) or "AccessDenied" in str(e):
            print(f"[BEDROCK] Claude image access denied, falling back to Nova Lite with image: {e}")
            return invoke_nova_lite_with_image(prompt, image_bytes, media_type, system)
        raise


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


def invoke_nova_lite_with_image(prompt: str, image_bytes: bytes, media_type: str, system: str = "") -> str:
    """Invoke Amazon Nova Lite with image input."""
    import base64

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
        modelId=settings.bedrock_lite_model_id,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(body),
    )

    result = json.loads(response["body"].read())
    return result["output"]["message"]["content"][0]["text"]
