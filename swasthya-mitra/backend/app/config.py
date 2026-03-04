from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # AWS
    aws_region: str = "ap-south-1"
    s3_bucket: str = "swasthyamitra-uploads"
    dynamodb_table: str = "swasthyamitra-interactions"

    # Bedrock Models
    bedrock_model_id: str = "us.anthropic.claude-sonnet-4-6"
    bedrock_lite_model_id: str = "amazon.nova-lite-v1:0"

    # Sarvam AI
    sarvam_api_key: str = ""
    sarvam_api_base: str = "https://api.sarvam.ai"

    # App
    environment: str = "development"
    max_file_size_mb: int = 10

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
