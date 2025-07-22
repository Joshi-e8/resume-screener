"""
Authentication endpoints
"""

from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr

from app.core.config import settings
from app.core.security import (
    create_access_token,
    get_current_user,
    verify_password,
    get_password_hash
)
from app.models.user import User, UserCreate, UserResponse
from app.services.user_service import UserService

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

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

@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user_service = UserService()
    user = await user_service.authenticate_user(login_data.email, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": UserResponse.from_orm(user)
    }

@router.post("/register", response_model=UserResponse)
async def register(user_data: RegisterRequest) -> Any:
    """
    Create new user account
    """
    user_service = UserService()
    
    # Check if user already exists
    existing_user = await user_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create new user
    user_create = UserCreate(
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name,
        company_name=user_data.company_name
    )
    
    user = await user_service.create_user(user_create)
    return UserResponse.from_orm(user)

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
        "user": UserResponse.from_orm(current_user)
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
