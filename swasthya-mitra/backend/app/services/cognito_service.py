"""Amazon Cognito authentication service.

Handles user sign-up, sign-in, token verification, and password management.
Uses Cognito User Pools for authentication.
"""

import asyncio
import boto3
import hmac
import hashlib
import base64
from typing import Optional
from app.config import get_settings

settings = get_settings()
cognito_client = boto3.client("cognito-idp", region_name=settings.aws_region)


def _get_secret_hash(username: str) -> Optional[str]:
    """Compute SECRET_HASH if app client has a secret configured."""
    # For public app clients (no secret), return None
    # If your app client has a secret, set COGNITO_APP_CLIENT_SECRET in env
    return None


async def sign_up(username: str, password: str, email: str, phone: str = None, role: str = "patient") -> dict:
    """Register a new user in Cognito User Pool."""
    attributes = [
        {"Name": "email", "Value": email},
        {"Name": "custom:role", "Value": role},
    ]
    if phone:
        attributes.append({"Name": "phone_number", "Value": phone})

    try:
        response = await asyncio.to_thread(
            cognito_client.sign_up,
            ClientId=settings.cognito_app_client_id,
            Username=username,
            Password=password,
            UserAttributes=attributes,
        )
        return {
            "user_id": response["UserSub"],
            "confirmed": response["UserConfirmed"],
            "message": "Verification code sent to email.",
        }
    except cognito_client.exceptions.UsernameExistsException:
        return {"error": "Username already exists."}
    except Exception as e:
        return {"error": str(e)}


async def confirm_sign_up(username: str, confirmation_code: str) -> dict:
    """Confirm user registration with verification code."""
    try:
        await asyncio.to_thread(
            cognito_client.confirm_sign_up,
            ClientId=settings.cognito_app_client_id,
            Username=username,
            ConfirmationCode=confirmation_code,
        )
        return {"confirmed": True}
    except Exception as e:
        return {"error": str(e)}


async def sign_in(username: str, password: str) -> dict:
    """Authenticate user and return tokens."""
    try:
        response = await asyncio.to_thread(
            cognito_client.initiate_auth,
            ClientId=settings.cognito_app_client_id,
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={
                "USERNAME": username,
                "PASSWORD": password,
            },
        )
        auth_result = response.get("AuthenticationResult", {})
        return {
            "access_token": auth_result.get("AccessToken"),
            "id_token": auth_result.get("IdToken"),
            "refresh_token": auth_result.get("RefreshToken"),
            "expires_in": auth_result.get("ExpiresIn"),
        }
    except cognito_client.exceptions.NotAuthorizedException:
        return {"error": "Invalid username or password."}
    except cognito_client.exceptions.UserNotConfirmedException:
        return {"error": "Please verify your email first."}
    except Exception as e:
        return {"error": str(e)}


async def refresh_tokens(refresh_token: str) -> dict:
    """Refresh access token using refresh token."""
    try:
        response = await asyncio.to_thread(
            cognito_client.initiate_auth,
            ClientId=settings.cognito_app_client_id,
            AuthFlow="REFRESH_TOKEN_AUTH",
            AuthParameters={"REFRESH_TOKEN": refresh_token},
        )
        auth_result = response.get("AuthenticationResult", {})
        return {
            "access_token": auth_result.get("AccessToken"),
            "id_token": auth_result.get("IdToken"),
            "expires_in": auth_result.get("ExpiresIn"),
        }
    except Exception as e:
        return {"error": str(e)}


async def get_user_info(access_token: str) -> Optional[dict]:
    """Get user info from access token."""
    try:
        response = await asyncio.to_thread(
            cognito_client.get_user,
            AccessToken=access_token,
        )
        attrs = {a["Name"]: a["Value"] for a in response.get("UserAttributes", [])}
        return {
            "username": response["Username"],
            "email": attrs.get("email"),
            "phone": attrs.get("phone_number"),
            "role": attrs.get("custom:role", "patient"),
            "email_verified": attrs.get("email_verified") == "true",
            "sub": attrs.get("sub"),
        }
    except Exception:
        return None


async def verify_token(access_token: str) -> Optional[str]:
    """Verify access token and return username. Returns None if invalid."""
    user = await get_user_info(access_token)
    if user:
        return user["username"]
    return None


async def forgot_password(username: str) -> dict:
    """Initiate forgot password flow."""
    try:
        await asyncio.to_thread(
            cognito_client.forgot_password,
            ClientId=settings.cognito_app_client_id,
            Username=username,
        )
        return {"message": "Password reset code sent to email."}
    except Exception as e:
        return {"error": str(e)}


async def confirm_forgot_password(username: str, code: str, new_password: str) -> dict:
    """Reset password with confirmation code."""
    try:
        await asyncio.to_thread(
            cognito_client.confirm_forgot_password,
            ClientId=settings.cognito_app_client_id,
            Username=username,
            ConfirmationCode=code,
            Password=new_password,
        )
        return {"message": "Password reset successfully."}
    except Exception as e:
        return {"error": str(e)}


async def sign_out(access_token: str) -> dict:
    """Sign out user (invalidate tokens)."""
    try:
        await asyncio.to_thread(
            cognito_client.global_sign_out,
            AccessToken=access_token,
        )
        return {"message": "Signed out successfully."}
    except Exception as e:
        return {"error": str(e)}
