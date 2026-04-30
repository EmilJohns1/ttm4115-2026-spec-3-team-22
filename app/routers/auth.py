import uuid

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.auth import REFRESH_TOKEN_AUDIENCE, SECRET, get_jwt_strategy, get_user_manager

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
