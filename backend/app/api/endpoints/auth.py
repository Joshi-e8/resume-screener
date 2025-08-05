"""
Authentication endpoints
"""

from datetime import timedelta
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_current_user,
)
from app.models.user import User, UserCreate, UserResponse
from app.services.user_service import UserService

router = APIRouter()


class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str
    expires_in: int
    user: UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class OtpResponse(BaseModel):
    message: str
    result: str
    otp: str
    verification_url: str
    resend_otp_url: str = None
    expires_in: int


class OtpPayload(BaseModel):
    otp: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    company_name: str = None


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class SocialLoginRequest(BaseModel):
    token: str
    email: str
    google_id: Optional[str] = None
    name: Optional[str] = None
    image: Optional[str] = None


@router.post("/login", response_model=OtpResponse)
async def login(login_data: LoginRequest) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user_service = UserService()
    user = await user_service.get_user_by_email(login_data.email)

    if not user:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"result": "failure", "errors": {"email": "Email not found"}},
        )

    is_authenticated = await user_service.authenticate_user(
        login_data.email, login_data.password
    )
    if not is_authenticated:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"result": "failure", "errors": {"password": "Incorrect password"}},
        )

    if not user.is_active:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"result": "failure", "errors": {"email": "Account is inactive"}},
        )

    return await user_service.generate_otp(login_data.email)


@router.post("/register", response_model=OtpResponse)
async def register(user_data: RegisterRequest) -> Any:
    """
    Create new user account and return access token
    """
    user_service = UserService()

    # Check if user already exists
    existing_user = await user_service.get_user_by_email(user_data.email)
    if existing_user:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "result": "failure",
                "errors": {"email": "User with this email already exists"},
            },
        )

    # Create new user
    user_create = UserCreate(
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name,
        company_name=user_data.company_name,
    )

    user = await user_service.create_user(user_create)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User creation failed",
        )

    return await user_service.generate_otp(user.email)


@router.post("/social-login/{provider}/", response_model=Token)
async def social_login(provider: str, request: SocialLoginRequest):
    """
    Social login endpoint for third-party authentication providers
    """
    user_service = UserService()
    print(request.token, "token----------------------")
    if provider not in settings.SOCIAL_AUTH_PROVIDERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid authentication provider",
        )

    # Verify token with the provider
    user_info = await user_service.verify_social_token(provider, request.token)

    if not user_info or not user_info.get("email"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token or user not found",
        )

    # Check if user already exists
    user = await user_service.get_user_by_email(user_info["email"])

    if not user:
        user_create = UserCreate(
            email=user_info["email"],
            full_name=user_info.get("name", ""),
            company_name=user_info.get("company_name", ""),
        )
        user = await user_service.create_user(user_create)

    # Generate access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    response = {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": UserResponse.from_orm(user),
    }
    return response


@router.post("/verify-otp/{user_id}", response_model=Token)
async def verify_otp(user_id: str, otp_payload: OtpPayload) -> Any:
    """
    Verify OTP and return access token
    """
    user_service = UserService()
    user = await user_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    try:
        key = f"otp:{user_id}"
        stored_otp = await user_service.redis_client.get(key)

        if not stored_otp:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "result": "failure",
                    "errors": {"otp": "OTP expired. Please request a new one."},
                },
            )

        if stored_otp.decode() != otp_payload.otp:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "result": "failure",
                    "errors": {
                        "otp": "The entered OTP is incorrect. " "Please try again."
                    },
                },
            )

        # OTP is valid, delete it from Redis
        await user_service.redis_client.delete(key)

    except HTTPException:
        raise
    except Exception:  # noqa: E722
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"result": "failure", "errors": {"otp": "OTP verification failed"}},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": UserResponse.from_orm(user),
    }


@router.post("/resend-otp/{user_id}", response_model=OtpResponse)
async def resend_otp(user_id: str) -> Any:
    """
    Resend OTP to user email
    """
    user_service = UserService()
    user = await user_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return await user_service.generate_otp(user.email)


@router.post("/refresh-token", response_model=Token)
async def refresh_token(current_user: User = Depends(get_current_user)) -> Any:
    """
    Refresh access token
    """
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(current_user.id)}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": UserResponse.from_orm(current_user),
    }


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)) -> Any:
    """
    Get current user
    """
    return UserResponse.from_orm(current_user)


@router.post("/password-reset")
async def password_reset(reset_data: PasswordResetRequest) -> Any:
    """
    Request password reset
    """
    user_service = UserService()
    user = await user_service.get_user_by_email(reset_data.email)

    if not user:
        # Don't reveal if user exists or not
        return {"message": "If the email exists, a reset link has been sent"}

    # TODO: Implement email sending logic
    # For now, just return success message
    return {"message": "Password reset email sent"}


@router.post("/password-reset-confirm")
async def password_reset_confirm(reset_data: PasswordResetConfirm) -> Any:
    """
    Confirm password reset with token
    """
    # TODO: Implement token verification and password reset
    return {"message": "Password reset successful"}


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)) -> Any:
    """
    Logout user (invalidate token on client side)
    """
    return {"message": "Successfully logged out"}
