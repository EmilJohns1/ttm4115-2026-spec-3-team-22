from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

from app.routers import orders, drones, products, payment
from app.auth import fastapi_users, auth_backend
from app.schemas.users import UserRead, UserCreate, UserUpdate
from app.db.base import Base, engine, SessionLocal
from app.db import models
from app.db.seed import seed_db
from app.mqtt.mqtt_client import mqtt_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()
    
    # Start MQTT background listener
    mqtt_service.start() #Add this when we have the MQTT client implemented and ready to use
    
    yield
    
    # Shutdown logic
    mqtt_service.stop()

app = FastAPI(
    title="TTM4115 Backend",
    description="A sample FastAPI project for TTM4115.",
    version="0.1.0",
    lifespan=lifespan,
)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

allow_origins = [url.strip() for url in frontend_url.split(",")] if frontend_url else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fastapi_users.get_auth_router(auth_backend), prefix="/auth/jwt", tags=["auth"])
app.include_router(fastapi_users.get_register_router(UserRead, UserCreate), prefix="/auth", tags=["auth"])
app.include_router(fastapi_users.get_users_router(UserRead, UserUpdate), prefix="/users", tags=["users"])
app.include_router(orders.router)
app.include_router(products.router)
app.include_router(drones.router)
app.include_router(payment.router)


@app.get("/", tags=["root"])
def read_root() -> dict:
    """Health-check / welcome endpoint."""
    return {"message": "Welcome to the TTM4115 Backend API!"}
