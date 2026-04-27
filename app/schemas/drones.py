from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DroneStatusBase(BaseModel):
    drone_id: str
    battery: float
    gps_lat: Optional[float] = None
    gps_lon: Optional[float] = None
    speed: Optional[float] = None
    current_order_id: Optional[str] = None

class DroneStatusCreate(DroneStatusBase):
    pass

class DroneStatusUpdate(BaseModel):
    battery: Optional[float] = None
    gps_lat: Optional[float] = None
    gps_lon: Optional[float] = None
    speed: Optional[float] = None
    current_order_id: Optional[str] = None

class DroneStatus(DroneStatusBase):
    last_updated: datetime

    model_config = {"from_attributes": True}
