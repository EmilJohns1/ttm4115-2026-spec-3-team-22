from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import deps, models
from app.schemas import drones as schemas
from typing import List

router = APIRouter(prefix="/drones", tags=["drones"])

@router.post("/", response_model=schemas.DroneStatus)
def create_drone(drone: schemas.DroneStatusCreate, db: Session = Depends(deps.get_db)):
    db_drone = db.query(models.DroneStatus).filter(models.DroneStatus.drone_id == drone.drone_id).first()
    if db_drone:
        raise HTTPException(status_code=400, detail="Drone with this ID already exists")
    new_drone = models.DroneStatus(**drone.model_dump())
    db.add(new_drone)
    db.commit()
    db.refresh(new_drone)
    return new_drone

@router.get("/", response_model=List[schemas.DroneStatus])
def read_drones(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    return db.query(models.DroneStatus).offset(skip).limit(limit).all()

@router.get("/{drone_id}", response_model=schemas.DroneStatus)
def read_drone(drone_id: str, db: Session = Depends(deps.get_db)):
    drone = db.query(models.DroneStatus).filter(models.DroneStatus.drone_id == drone_id).first()
    if not drone:
        raise HTTPException(status_code=404, detail="Drone not found")
    return drone

@router.put("/{drone_id}", response_model=schemas.DroneStatus)
def update_drone(drone_id: str, drone_update: schemas.DroneStatusUpdate, db: Session = Depends(deps.get_db)):
    db_drone = db.query(models.DroneStatus).filter(models.DroneStatus.drone_id == drone_id).first()
    if not db_drone:
        raise HTTPException(status_code=404, detail="Drone not found")
        
    update_data = drone_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_drone, key, value)
        
    db.commit()
    db.refresh(db_drone)
    return db_drone
