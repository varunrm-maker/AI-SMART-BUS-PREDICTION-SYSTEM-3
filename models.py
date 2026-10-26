"""
SmartBus AI - Data Schemas & Models
Pydantic Schemas for Scalable Transit API
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# --- Bus Stand Schemas ---
class BusStandBase(BaseModel):
    id: str
    name: str
    city: str
    location: str
    lat: float
    lng: float
    active_buses: int = 0
    passenger_capacity: int
    current_crowd_percent: int
    status: str
    next_bus_timing: str
    description: str

class BusStandResponse(BusStandBase):
    pass

# --- Bus Telemetry & Fleet Schemas ---
class BusTelemetryUpdate(BaseModel):
    bus_id: str
    occupied_seats: int
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    speed_kmh: Optional[float] = None
    door_in_count: Optional[int] = 0
    door_out_count: Optional[int] = 0

class BusResponse(BaseModel):
    id: str
    bus_number: str
    route_name: str
    origin_stand_id: str
    dest_stand_id: str
    departure_time: str
    arrival_time: str
    capacity: int
    occupied_seats: int
    available_seats: int
    crowd_percent: int
    status: str  # FREE, MODERATE, FULL
    speed_km: float
    current_progress: float
    route_waypoints: List[List[float]]
    last_updated: datetime = Field(default_factory=datetime.utcnow)

# --- AI Crowd Prediction Request & Response ---
class CrowdPredictionRequest(BaseModel):
    route_id: str
    target_hour: int = Field(ge=0, le=23, description="Hour of the day (0-23)")
    day_of_week: int = Field(ge=0, le=6, description="0=Monday, 6=Sunday")
    is_holiday: bool = False
    weather_condition: Optional[str] = "clear"
    historical_passenger_flow: Optional[List[int]] = None

class CrowdPredictionResponse(BaseModel):
    route_id: str
    target_hour: int
    predicted_occupancy_percent: float
    predicted_status: str  # FREE, MODERATE, FULL
    confidence_interval_low: float
    confidence_interval_high: float
    model_used: str  # e.g., "PatchTST-Ensemble-v2"
    peak_risk_flag: bool
    recommended_alternative_bus: Optional[str] = None
    recommendation_reason: str

# --- User Feedback Schema (Project Better Tomorrow Validation) ---
class CommuterFeedbackCreate(BaseModel):
    commuter_name: str
    commuter_role: str  # e.g., "College Student", "Daily Commuter", "Senior Citizen"
    primary_route: str
    ui_ux_rating: int = Field(ge=1, le=5)
    crowd_categorization_accurate: bool
    suggested_crowd_threshold_changes: Optional[str] = None
    feedback_notes: str

class CommuterFeedbackResponse(CommuterFeedbackCreate):
    id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# --- Travel Alert Schemas ---
class AlertMessage(BaseModel):
    id: str
    type: str  # HIGH_CROWD, SMART_CHOICE, STAND_CONGESTION, ARRIVAL
    severity: str  # danger, warning, success, info
    title: str
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False
