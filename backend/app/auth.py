from fastapi_users.authentication import AuthenticationBackend, BearerTransport, JWTStrategy
from fastapi_users.db import SQLAlchemyUserDatabase
from fastapi_users import FastAPIUsers
from fastapi_users.jwt import generate_jwt, decode_jwt
import uuid
from typing import Optional
from fastapi import Depends, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from .db.models import User
from .db.base import AsyncSessionLocal
from sqlalchemy.ext.asyncio import AsyncSession
import os


class DualBearerResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


SECRET = os.getenv("SECRET_KEY", "SUPERSECRETKEY")
REFRESH_LIFETIME_SECONDS = 60 * 60 * 24 * 30  # 30 days
REFRESH_TOKEN_AUDIENCE = ["fastapi-users:refresh"]


def create_refresh_token(user_id: str) -> str:
    return generate_jwt(
        {"sub": user_id, "aud": REFRESH_TOKEN_AUDIENCE},
        SECRET,
        REFRESH_LIFETIME_SECONDS,
    )


class DualTokenTransport(BearerTransport):
    async def get_login_response(self, token: str) -> Response:
        payload = decode_jwt(token, SECRET, ["fastapi-users:auth"])
        refresh_token = create_refresh_token(payload["sub"])
        return JSONResponse({
            "access_token": token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        })

    @staticmethod
    def get_openapi_login_responses_success() -> dict:
        return {
            200: {
                "model": DualBearerResponse,
                "content": {
                    "application/json": {
                        "example": {
                            "access_token": "eyJ...",
                            "refresh_token": "eyJ...",
                            "token_type": "bearer",
                        }
                    }
                },
            }
        }


bearer_transport = DualTokenTransport(tokenUrl="auth/jwt/login")


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=SECRET, lifetime_seconds=3600)


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)


async def get_async_session():
    async with AsyncSessionLocal() as session:
        yield session


async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User)


from fastapi_users import BaseUserManager, UUIDIDMixin


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = SECRET
    verification_token_secret = SECRET

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        print(f"User {user.id} has registered.")


async def get_user_manager(user_db=Depends(get_user_db)):
    yield UserManager(user_db)


fastapi_users = FastAPIUsers[User, uuid.UUID](
    get_user_manager,
    [auth_backend],
)

current_active_user = fastapi_users.current_user(active=True)
