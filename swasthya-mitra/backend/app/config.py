from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # AWS
    aws_region: str = "ap-south-1"
    s3_bucket: str = "swasthyamitra-uploads"

    # DynamoDB tables
    dynamodb_users_table: str = "swasthyamitra-users"
    dynamodb_interactions_table: str = "swasthyamitra-interactions"
    dynamodb_entities_table: str = "swasthyamitra-medical-entities"

    # Cognito
    cognito_user_pool_id: str = ""
    cognito_app_client_id: str = ""

    # Bedrock Model
    bedrock_model_id: str = "amazon.nova-lite-v1:0"
    bedrock_lite_model_id: str = "amazon.nova-lite-v1:0"

    # Sarvam AI (fallback for TTS in non-Hindi/English languages)
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
