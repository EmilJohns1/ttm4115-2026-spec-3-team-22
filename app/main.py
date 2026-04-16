from fastapi import FastAPI

from app.routers import users, orders, drones
from app.db.base import Base, engine
from app.db import models

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TTM4115 Backend",
    description="A sample FastAPI project for TTM4115.",
    version="0.1.0",
)

app.include_router(users.router)
app.include_router(orders.router)
app.include_router(drones.router)


@app.get("/", tags=["root"])
def read_root() -> dict:
    """Health-check / welcome endpoint."""
    return {"message": "Welcome to the TTM4115 Backend API!"}
