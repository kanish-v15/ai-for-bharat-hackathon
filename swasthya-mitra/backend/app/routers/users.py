from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.dynamodb_service import create_user, get_user, update_user, delete_user

router = APIRouter(prefix="/users", tags=["Users"])


class UserProfile(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    language: str = "hindi"
    role: str = "patient"  # patient | doctor
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[list[str]] = None
    conditions: Optional[list[str]] = None
    medications: Optional[list[str]] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None
    abha_id: Optional[str] = None
    # Doctor-specific fields
    registration_number: Optional[str] = None
    specialization: Optional[str] = None
    clinic_name: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    language: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[list[str]] = None
    conditions: Optional[list[str]] = None
    medications: Optional[list[str]] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None
    abha_id: Optional[str] = None
    registration_number: Optional[str] = None
    specialization: Optional[str] = None
    clinic_name: Optional[str] = None


@router.post("/{user_id}")
async def create_or_update_profile(user_id: str, profile: UserProfile):
    """Create or fully replace a user profile."""
    profile_dict = profile.model_dump(exclude_none=True)
    result = await create_user(user_id, profile_dict)
    return result


@router.get("/{user_id}")
async def get_profile(user_id: str):
    """Get a user profile."""
    user = await get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


@router.patch("/{user_id}")
async def patch_profile(user_id: str, updates: UserUpdate):
    """Update specific fields on a user profile."""
    updates_dict = updates.model_dump(exclude_none=True)
    if not updates_dict:
        raise HTTPException(status_code=400, detail="No fields to update.")
    result = await update_user(user_id, updates_dict)
    return result


@router.delete("/{user_id}")
async def remove_profile(user_id: str):
    """Delete a user profile."""
    await delete_user(user_id)
    return {"status": "deleted"}
