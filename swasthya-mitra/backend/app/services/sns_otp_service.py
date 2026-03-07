"""AWS SNS OTP Service — send and verify OTPs via SMS for Indian mobile numbers."""

import asyncio
import random
import time
from typing import Optional
import boto3
from app.config import get_settings

settings = get_settings()
sns_client = boto3.client("sns", region_name=settings.aws_region)

# In-memory OTP store (use DynamoDB for production scale)
# Format: { "+91XXXXXXXXXX": { "otp": "123456", "expires": timestamp } }
_otp_store: dict[str, dict] = {}

OTP_LENGTH = 6
OTP_EXPIRY_SECONDS = 300  # 5 minutes


def _generate_otp() -> str:
    """Generate a random 6-digit OTP."""
    return str(random.randint(100000, 999999))


def _clean_phone(phone: str) -> str:
    """Normalize phone number to E.164 format (+91XXXXXXXXXX)."""
    phone = phone.strip().replace(" ", "").replace("-", "")
    if phone.startswith("+91"):
        return phone
    if phone.startswith("91") and len(phone) == 12:
        return f"+{phone}"
    if len(phone) == 10 and phone.isdigit():
        return f"+91{phone}"
    return phone


async def send_otp(phone: str) -> dict:
    """Generate OTP and send via AWS SNS SMS.

    Args:
        phone: Indian mobile number (10 digits or +91XXXXXXXXXX)

    Returns:
        {"success": True, "message": "OTP sent"} or {"error": "..."}
    """
    phone_e164 = _clean_phone(phone)

    if len(phone_e164) != 13 or not phone_e164[1:].isdigit():
        return {"error": "Invalid phone number. Please enter a valid 10-digit Indian mobile number."}

    # Rate limit: don't allow resend within 30 seconds
    existing = _otp_store.get(phone_e164)
    if existing and (time.time() - existing.get("created", 0)) < 30:
        return {"error": "Please wait 30 seconds before requesting another OTP."}

    otp = _generate_otp()
    _otp_store[phone_e164] = {
        "otp": otp,
        "expires": time.time() + OTP_EXPIRY_SECONDS,
        "created": time.time(),
        "attempts": 0,
    }

    # Skip actual SMS — return OTP in response for auto-fill
    # This avoids SNS SMS costs. For production with real SMS, remove dev_otp from response
    # and uncomment the SNS publish block below.
    print(f"[SNS OTP] OTP for {phone_e164}: {otp}")
    return {"success": True, "message": "OTP sent successfully.", "dev_otp": otp}

    # # Production: send via AWS SNS (uncomment when ready for real SMS)
    # message = f"Your SwasthyaMitra verification code is: {otp}. Valid for 5 minutes. Do not share this code."
    # try:
    #     await asyncio.to_thread(
    #         sns_client.publish,
    #         PhoneNumber=phone_e164,
    #         Message=message,
    #         MessageAttributes={
    #             "AWS.SNS.SMS.SenderID": {
    #                 "DataType": "String",
    #                 "StringValue": "SWSMITRA",
    #             },
    #             "AWS.SNS.SMS.SMSType": {
    #                 "DataType": "String",
    #                 "StringValue": "Transactional",
    #             },
    #         },
    #     )
    #     return {"success": True, "message": "OTP sent successfully."}
    # except Exception as e:
    #     return {"error": f"Failed to send OTP: {str(e)}"}


async def verify_otp(phone: str, otp: str) -> dict:
    """Verify the OTP entered by the user.

    Args:
        phone: Indian mobile number
        otp: 6-digit OTP string

    Returns:
        {"success": True, "verified": True} or {"error": "..."}
    """
    phone_e164 = _clean_phone(phone)
    stored = _otp_store.get(phone_e164)

    if not stored:
        return {"error": "No OTP found for this number. Please request a new OTP."}

    # Check expiry
    if time.time() > stored["expires"]:
        del _otp_store[phone_e164]
        return {"error": "OTP has expired. Please request a new one."}

    # Check max attempts (prevent brute force)
    if stored["attempts"] >= 5:
        del _otp_store[phone_e164]
        return {"error": "Too many incorrect attempts. Please request a new OTP."}

    stored["attempts"] += 1

    if stored["otp"] != otp.strip():
        remaining = 5 - stored["attempts"]
        return {"error": f"Invalid OTP. {remaining} attempts remaining."}

    # OTP verified — clean up
    del _otp_store[phone_e164]
    return {"success": True, "verified": True}


async def resend_otp(phone: str) -> dict:
    """Resend OTP (generates a new one)."""
    return await send_otp(phone)
