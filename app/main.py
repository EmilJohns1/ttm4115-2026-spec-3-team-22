from fastapi import FastAPI

from app.routers import items

app = FastAPI(
    title="TTM4115 Backend",
    description="A sample FastAPI project for TTM4115.",
    version="0.1.0",
)

app.include_router(items.router)


@app.get("/", tags=["root"])
def read_root() -> dict:
    """Health-check / welcome endpoint."""
    return {"message": "Welcome to the TTM4115 Backend API!"}
