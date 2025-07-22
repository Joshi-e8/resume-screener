"""
User service for user management operations
"""

from typing import Optional, List, Tuple
from datetime import datetime, timezone
from beanie import PydanticObjectId

from app.models.user import User, UserCreate, UserUpdate
from app.core.security import verify_password, get_password_hash

class UserService:
    """Service class for user operations"""
    
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
            updated_at=datetime.now(timezone.utc)
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
    
    async def get_users(
        self, 
        skip: int = 0, 
        limit: int = 10, 
        search: Optional[str] = None
    ) -> Tuple[List[User], int]:
        """
        Get users with pagination and search
        """
        query = {}
        
        if search:
            query = {
                "$or": [
                    {"full_name": {"$regex": search, "$options": "i"}},
                    {"email": {"$regex": search, "$options": "i"}},
                    {"company_name": {"$regex": search, "$options": "i"}}
                ]
            }
        
        # Get total count
        total = await User.find(query).count()
        
        # Get users with pagination
        users = await User.find(query).skip(skip).limit(limit).to_list()
        
        return users, total
    
    async def update_subscription(
        self, 
        user_id: str, 
        plan: str, 
        expires: Optional[datetime] = None
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
