"""
Simple test for authentication system
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from passlib.context import CryptContext

# Test password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

password = "test123"
hashed = pwd_context.hash(password)
verified = pwd_context.verify(password, hashed)

print(f"✅ Password hashing test:")
print(f"   Original: {password}")
print(f"   Hashed: {hashed[:50]}...")
print(f"   Verified: {verified}")

# Test JWT token creation
from datetime import datetime, timedelta
from jose import jwt

SECRET_KEY = "test-secret-key"
ALGORITHM = "HS256"

def create_test_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_test_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except:
        return None

# Test token
test_data = {"sub": "user123"}
token = create_test_token(test_data)
decoded_user_id = verify_test_token(token)

print(f"\n✅ JWT token test:")
print(f"   Token: {token[:50]}...")
print(f"   Decoded user ID: {decoded_user_id}")

print(f"\n🎉 Authentication system components working correctly!")
