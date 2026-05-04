import uuid

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import REFRESH_TOKEN_AUDIENCE, SECRET, current_active_user, get_async_session, get_jwt_strategy, get_user_manager
from app.db.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/refresh")
async def refresh_access_token(
    body: RefreshRequest,
    user_manager=Depends(get_user_manager),
):
    try:
        payload = jwt.decode(
            body.refresh_token,
            SECRET,
            algorithms=["HS256"],
            audience=REFRESH_TOKEN_AUDIENCE,
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise ValueError
    except (jwt.PyJWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    try:
        user = await user_manager.get(uuid.UUID(user_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is inactive")

    access_token = await get_jwt_strategy().write_token(user)
    return {"access_token": access_token, "token_type": "bearer"}


class DeviceTokenRequest(BaseModel):
    token: str


@router.post("/device-token", status_code=204)
async def register_device_token(
    body: DeviceTokenRequest,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    await session.execute(update(User).where(User.id == user.id).values(push_token=body.token))
    await session.commit()


@router.delete("/device-token", status_code=204)
async def delete_device_token(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    await session.execute(update(User).where(User.id == user.id).values(push_token=None))
    await session.commit()
