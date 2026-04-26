from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.routers import users, orders, drones, products
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
    #mqtt_service.start() Add this when we have the MQTT client implemented and ready to use
    
    yield
    
    # Shutdown logic
    #mqtt_service.stop()

app = FastAPI(
    title="TTM4115 Backend",
    description="A sample FastAPI project for TTM4115.",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(users.router)
app.include_router(orders.router)
app.include_router(products.router)
app.include_router(drones.router)


@app.get("/", tags=["root"])
def read_root() -> dict:
    """Health-check / welcome endpoint."""
    return {"message": "Welcome to the TTM4115 Backend API!"}
