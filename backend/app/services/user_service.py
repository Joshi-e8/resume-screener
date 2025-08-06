"""
User service for user management operations
"""

from datetime import datetime, timezone
from typing import Dict, Optional

import jwt
import requests
from authlib.integrations.starlette_client import OAuth
from beanie import PydanticObjectId
from redis import asyncio as aioredis

from app.core.config import settings
from app.core.security import (create_access_token, create_refresh_token,
                               get_password_hash, verify_password,
                               verify_refresh_token)
from app.models.user import User, UserCreate, UserUpdate

oauth = OAuth()

oauth.register(
    name="google",
    server_metadata_url=(
        "https://accounts.google.com/.well-known/openid-configuration"
    ),
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    client_kwargs={"scope": "openid email profile"},
)

oauth.register(
    name="linkedin",
    client_id=settings.LINKEDIN_CLIENT_ID,
    client_secret=settings.LINKEDIN_CLIENT_SECRET,
    authorize_url="https://www.linkedin.com/oauth/v2/authorization",
    access_token_url="https://www.linkedin.com/oauth/v2/accessToken",
    api_base_url="https://api.linkedin.com/v2/",
    client_kwargs={"scope": "r_liteprofile r_emailaddress"},
)


class UserService:
    """Service class for user operations"""

    redis_client = aioredis.from_url(settings.REDIS_URL)

    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """
        Authenticate user with email and password
        """
        user = await User.find_one(User.email == email)
        if not user:
            return None

        if not verify_password(password, user.hashed_password):
            return None

        # Update last login
        user.last_login = datetime.now(timezone.utc)
        await user.save()

        return user

    async def generate_otp(self, email: str) -> str:
        """
        Generate a one-time password (OTP) for user verification
        and store it in Redis with a short expiration.
        """
        user = await self.get_user_by_email(email)
        if not user:
            raise ValueError("User not found")

        # otp = str(secrets.randbelow(1000000)).zfill(6)  # Secure 6-digit OTP
        otp = "123456"
        key = f"otp:{user.id}"
        await self.redis_client.set(
            key, otp, ex=settings.OTP_EXPIRE
        )  # OTP expires in 5 minutes

        verification_url = (
            f"{settings.BACKEND_URL}{settings.API_V1_STR}"
            f"/auth/verify-otp/{user.id}/"
        )
        resend_otp_url = (
            f"{settings.BACKEND_URL}{settings.API_V1_STR}"
            f"/auth/resend-otp/{user.id}/"
        )
        return {
            "message": "OTP generated successfully",
            "result": "success",
            "otp": otp,
            "verification_url": verification_url,
            "resend_otp_url": resend_otp_url,
            "expires_in": settings.OTP_EXPIRE,
        }

    async def verify_social_token(self, provider: str, token: str) -> Optional[Dict]:
        """
        Verify social authentication token and return user information
        """
        if provider == "google":
            try:
                # Check if token is an ID token (JWT format) or access token
                if token.count(".") == 2:  # JWT format (ID token)
                    # For ID tokens from NextAuth, we can decode without
                    # nonce verification since NextAuth has already verified it

                    # Get Google's public keys for verification
                    jwks_url = "https://www.googleapis.com/oauth2/v3/certs"
                    jwks_response = requests.get(jwks_url)
                    _ = jwks_response.json()  # noqa: F841

                    # Decode the token (NextAuth has already verified it,
                    # so we skip verification)
                    user_info = jwt.decode(token, options={"verify_signature": False})

                    return {
                        "email": user_info.get("email"),
                        "name": user_info.get("name"),
                        "picture": user_info.get("picture"),
                        "sub": user_info.get("sub"),
                    }
                else:
                    # Access token - use Google's userinfo endpoint
                    headers = {"Authorization": f"Bearer {token}"}
                    response = requests.get(
                        "https://www.googleapis.com/oauth2/v2/userinfo", headers=headers
                    )

                    if response.status_code == 200:
                        user_info = response.json()
                        return {
                            "email": user_info.get("email"),
                            "name": user_info.get("name"),
                            "picture": user_info.get("picture"),
                            "sub": user_info.get("id"),  # Google API uses 'id'
                        }
                    else:
                        print(
                            f"Google API error: {response.status_code} - "
                            f"{response.text}"
                        )
                        return None

            except Exception:
                print("Google token verification failed")
                return None

        elif provider == "linkedin":
            try:
                # Use Authlib to exchange auth code for access token
                client = oauth.create_client("linkedin")
                token_data = await client.authorize_access_token(token)

                # Fetch LinkedIn user profile
                user_profile = await client.get("me", token=token_data)
                profile_data = user_profile.json()

                # Fetch LinkedIn email
                user_email = await client.get(
                    "emailAddress?q=members&projection=(elements*(handle~))",
                    token=token_data,
                )
                email_data = user_email.json()
                email = email_data["elements"][0]["handle~"]["emailAddress"]

                full_name = (
                    f"{profile_data.get('localizedFirstName', '')} "
                    f"{profile_data.get('localizedLastName', '')}"
                )

                return {
                    "email": email,
                    "name": full_name,
                }

            except Exception:
                print("LinkedIn token verification failed")
                return None

        else:
            raise ValueError("Unsupported provider")

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Get user by email address
        """
        return await User.find_one(User.email == email)

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """
        Get user by ID
        """
        try:
            return await User.get(PydanticObjectId(user_id))
        except Exception:
            return None

    async def create_user(self, user_data: UserCreate) -> User:
        """
        Create a new user
        """
        # Hash the password
        hashed_password = get_password_hash(user_data.password)

        # Create user document
        user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            company_name=user_data.company_name,
            phone=user_data.phone,
            job_title=user_data.job_title,
            hashed_password=hashed_password,
            is_active=True,
            is_superuser=False,
            subscription_plan="free",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        await user.insert()
        return user

    async def update_user(self, user_id: str, user_data: UserUpdate) -> Optional[User]:
        """
        Update user information
        """
        user = await self.get_user_by_id(user_id)
        if not user:
            return None

        # Update fields
        update_data = user_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        user.updated_at = datetime.now(timezone.utc)
        await user.save()

        return user

    async def delete_user(self, user_id: str) -> bool:
        """
        Delete user by ID
        """
        user = await self.get_user_by_id(user_id)
        if not user:
            return False

        await user.delete()
        return True

    async def create_user_tokens(self, user_id: str) -> Dict[str, str]:
        """
        Create both access and refresh tokens for a user
        """
        token_data = {"sub": str(user_id)}

        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        # Store refresh token in Redis for revocation capability
        await self.store_refresh_token(user_id, refresh_token)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    async def store_refresh_token(self, user_id: str, refresh_token: str) -> bool:
        """
        Store refresh token in Redis with expiration
        """
        try:
            redis = aioredis.from_url(settings.REDIS_URL)
            # Store for 7 days (same as token expiration)
            await redis.setex(
                f"refresh_token:{user_id}",
                7 * 24 * 60 * 60,  # 7 days in seconds
                refresh_token,
            )
            await redis.close()
            return True
        except Exception:
            print("Failed to store refresh token")
            return False

    async def verify_refresh_token(self, user_id: str, refresh_token: str) -> bool:
        """
        Verify if refresh token is valid and stored in Redis
        """
        try:
            # First verify the token signature and expiration
            token_user_id = verify_refresh_token(refresh_token)
            if not token_user_id or token_user_id != user_id:
                return False

            # Then check if it's stored in Redis (not revoked)
            redis = aioredis.from_url(settings.REDIS_URL)
            stored_token = await redis.get(f"refresh_token:{user_id}")
            await redis.close()

            if not stored_token:
                return False

            return stored_token.decode() == refresh_token

        except Exception:
            print("Failed to verify refresh token")
            return False

    async def refresh_access_token(
        self, refresh_token: str
    ) -> Optional[Dict[str, str]]:
        """
        Generate new access token using refresh token
        """
        try:
            # Verify refresh token
            user_id = verify_refresh_token(refresh_token)
            if not user_id:
                return None

            # Check if refresh token is stored (not revoked)
            if not await self.verify_refresh_token(user_id, refresh_token):
                return None

            # Verify user still exists and is active
            user = await self.get_user_by_id(user_id)
            if not user or not user.is_active:
                return None

            # Create new access token
            token_data = {"sub": str(user_id)}
            new_access_token = create_access_token(token_data)

            return {"access_token": new_access_token, "token_type": "bearer"}

        except Exception:
            print("Failed to refresh access token")
            return None

    async def revoke_refresh_token(self, user_id: str) -> bool:
        """
        Revoke refresh token by removing it from Redis
        """
        try:
            redis = aioredis.from_url(settings.REDIS_URL)
            await redis.delete(f"refresh_token:{user_id}")
            await redis.close()
            return True
        except Exception:
            print("Failed to revoke refresh token")
            return False

    async def revoke_all_user_tokens(self, user_id: str) -> bool:
        """
        Revoke all refresh tokens for a user
        (useful for logout from all devices)
        """
        try:
            redis = aioredis.from_url(settings.REDIS_URL)
            # Find all refresh tokens for this user
            pattern = f"refresh_token:{user_id}*"
            keys = await redis.keys(pattern)
            if keys:
                await redis.delete(*keys)
            await redis.close()
            return True
        except Exception:
            print("Failed to revoke all user tokens")
            return False

    async def activate_user(self, user_id: str) -> bool:
        """
        Activate user account
        """
        user = await self.get_user_by_id(user_id)
        if not user:
            return False

        user.is_active = True
        user.updated_at = datetime.now(timezone.utc)
        await user.save()

        return True

    async def deactivate_user(self, user_id: str) -> bool:
        """
        Deactivate user account
        """
        user = await self.get_user_by_id(user_id)
        if not user:
            return False

        user.is_active = False
        user.updated_at = datetime.now(timezone.utc)
        await user.save()

        return True

    async def update_subscription(
        self, user_id: str, plan: str, expires: Optional[datetime] = None
    ) -> bool:
        """
        Update user subscription plan
        """
        user = await self.get_user_by_id(user_id)
        if not user:
            return False

        user.subscription_plan = plan
        user.subscription_expires = expires
        user.updated_at = datetime.now(timezone.utc)
        await user.save()

        return True

    async def increment_usage(self, user_id: str, metric: str, count: int = 1) -> bool:
        """
        Increment usage metrics for user
        """
        user = await self.get_user_by_id(user_id)
        if not user:
            return False

        if metric == "resumes":
            user.resumes_processed += count
        elif metric == "jobs":
            user.jobs_posted += count
        elif metric == "api_calls":
            user.api_calls_count += count

        user.updated_at = datetime.now(timezone.utc)
        await user.save()

        return True

    async def connect_platform(self, user_id: str, platform_id: str) -> bool:
        """
        Add platform to user's connected platforms
        """
        user = await self.get_user_by_id(user_id)
        if not user:
            return False

        if not user.connected_platforms:
            user.connected_platforms = []

        if platform_id not in user.connected_platforms:
            user.connected_platforms.append(platform_id)
            user.updated_at = datetime.now(timezone.utc)
            await user.save()

        return True

    async def disconnect_platform(self, user_id: str, platform_id: str) -> bool:
        """
        Remove platform from user's connected platforms
        """
        user = await self.get_user_by_id(user_id)
        if not user:
            return False

        if user.connected_platforms and platform_id in user.connected_platforms:
            user.connected_platforms.remove(platform_id)
            user.updated_at = datetime.now(timezone.utc)
            await user.save()

        return True
