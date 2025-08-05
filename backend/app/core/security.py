"""
Security utilities for authentication and authorization
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.models.user import User

# Password hashing - Updated to avoid deprecated crypt module
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,  # Explicit rounds for better security
)

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Create JWT access token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Create JWT refresh token with longer expiration
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Refresh tokens typically last 7-30 days
        expire = datetime.now(timezone.utc) + timedelta(days=7)

    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_token(token: str, token_type: str = None) -> Optional[dict]:
    """
    Verify JWT token and return payload
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )

        # Check token type if specified
        if token_type and payload.get("type") != token_type:
            return None

        user_id: str = payload.get("sub")
        if user_id is None:
            return None

        return payload
    except JWTError:
        return None


def verify_access_token(token: str) -> Optional[str]:
    """
    Verify access token and return user ID
    """
    payload = verify_token(token, "access")
    return payload.get("sub") if payload else None


def verify_refresh_token(token: str) -> Optional[str]:
    """
    Verify refresh token and return user ID
    """
    payload = verify_token(token, "refresh")
    return payload.get("sub") if payload else None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password
    """
    return pwd_context.hash(password)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    Get current user from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token is invalid or expired, please login again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user_id = verify_access_token(token)
    if user_id is None:
        raise credentials_exception

    # Import here to avoid circular import
    from app.services.user_service import UserService

    user_service = UserService()
    user = await user_service.get_user_by_id(user_id)
    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get current active user
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
    return current_user


async def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get current active superuser
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )
    return current_user


def check_permissions(user: User, required_permissions: list) -> bool:
    """
    Check if user has required permissions
    """
    if user.is_superuser:
        return True

    user_permissions = user.permissions or []
    return all(perm in user_permissions for perm in required_permissions)


def require_permissions(required_permissions: list):
    """
    Decorator to require specific permissions
    """

    def permission_checker(current_user: User = Depends(get_current_active_user)):
        if not check_permissions(current_user, required_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
            )
        return current_user

    return permission_checker
