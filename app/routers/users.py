from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db import deps, models
from app.schemas import users as schemas
from typing import List, Optional
import hashlib
import os
import uuid

router = APIRouter(prefix="/users", tags=["users"])

def _hash_password(password: str) -> str:
    salt = os.urandom(16)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return f"{salt.hex()}:{pwd_hash.hex()}"

def _verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt_hex, hash_hex = hashed_password.split(':')
        salt = bytes.fromhex(salt_hex)
        pwd_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
        return pwd_hash.hex() == hash_hex
    except Exception:
        return False

def _map_to_user_schema(db_user: models.User) -> schemas.User:
    addr = schemas.Address(
        streetAddress=db_user.street_address or "",
        city=db_user.city or "",
        zipCode=db_user.zip_code or ""
    ) if (db_user.street_address or db_user.city or db_user.zip_code) else None

    return schemas.User(
        id=db_user.id,
        name=db_user.name,
        email=db_user.email,
        deliveryAddress=addr
    )

@router.post("/register", response_model=schemas.UserEnvelope)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(deps.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        return schemas.UserEnvelope(error={"code": "VALIDATION_ERROR", "message": "Email already registered"})

    new_id = f"{uuid.uuid4().hex[:8]}"
    hashed_pw = _hash_password(user_in.password)
    
    new_user = models.User(
        id=new_id,
        name=user_in.name,
        email=user_in.email,
        password_hash=hashed_pw,
        street_address=user_in.deliveryAddress.streetAddress if user_in.deliveryAddress else None,
        city=user_in.deliveryAddress.city if user_in.deliveryAddress else None,
        zip_code=user_in.deliveryAddress.zipCode if user_in.deliveryAddress else None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return schemas.UserEnvelope(data=_map_to_user_schema(new_user))

@router.post("/login", response_model=schemas.UserEnvelope)
def login_user(credentials: schemas.UserLogin, db: Session = Depends(deps.get_db)):
    db_user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not db_user or not _verify_password(credentials.password, db_user.password_hash):
        return schemas.UserEnvelope(error={"code": "VALIDATION_ERROR", "message": "Invalid email or password"})
    
    return schemas.UserEnvelope(data=_map_to_user_schema(db_user))

@router.get("/me", response_model=schemas.UserEnvelope)
def read_user_me(userId: str, db: Session = Depends(deps.get_db)):
    db_user = db.query(models.User).filter(models.User.id == userId).first()
    if not db_user:
        return schemas.UserEnvelope(error={"code": "NOT_FOUND", "message": "User not found"})
    return schemas.UserEnvelope(data=_map_to_user_schema(db_user))

@router.patch("/me", response_model=schemas.UserEnvelope)
def update_user_me(user: schemas.UserUpdate, userId: str = Query(...), db: Session = Depends(deps.get_db)):
    db_user = db.query(models.User).filter(models.User.id == userId).first()
    if not db_user:
        return schemas.UserEnvelope(error={"code": "NOT_FOUND", "message": "User not found"})

    if user.name is not None:
        db_user.name = user.name
    if user.email is not None:
        db_user.email = user.email

    if user.deliveryAddress is not None:
        db_user.street_address = user.deliveryAddress.streetAddress
        db_user.city = user.deliveryAddress.city
        db_user.zip_code = user.deliveryAddress.zipCode

    db.commit()
    db.refresh(db_user)
    return schemas.UserEnvelope(data=_map_to_user_schema(db_user))
