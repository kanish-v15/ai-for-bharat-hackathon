from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from app.services.cognito_service import (
    sign_up, confirm_sign_up, sign_in, refresh_tokens,
    get_user_info, forgot_password, confirm_forgot_password, sign_out,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


class SignUpRequest(BaseModel):
    username: str
    password: str
    email: str
    phone: Optional[str] = None
    role: str = "patient"


class ConfirmRequest(BaseModel):
    username: str
    confirmation_code: str


class SignInRequest(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    username: str


class ResetPasswordRequest(BaseModel):
    username: str
    code: str
    new_password: str


@router.post("/signup")
async def register(request: SignUpRequest):
    result = await sign_up(
        request.username, request.password, request.email,
        request.phone, request.role,
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/confirm")
async def confirm(request: ConfirmRequest):
    result = await confirm_sign_up(request.username, request.confirmation_code)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/signin")
async def login(request: SignInRequest):
    result = await sign_in(request.username, request.password)
    if "error" in result:
        raise HTTPException(status_code=401, detail=result["error"])
    return result


@router.post("/refresh")
async def refresh(request: RefreshRequest):
    result = await refresh_tokens(request.refresh_token)
    if "error" in result:
        raise HTTPException(status_code=401, detail=result["error"])
    return result


@router.get("/me")
async def me(authorization: str = Header(...)):
    """Get current user info from access token."""
    token = authorization.replace("Bearer ", "")
    user = await get_user_info(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    return user


@router.post("/forgot-password")
async def forgot(request: ForgotPasswordRequest):
    result = await forgot_password(request.username)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/reset-password")
async def reset(request: ResetPasswordRequest):
    result = await confirm_forgot_password(
        request.username, request.code, request.new_password,
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/signout")
async def logout(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    result = await sign_out(token)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
