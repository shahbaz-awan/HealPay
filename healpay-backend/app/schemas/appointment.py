from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AppointmentCreate(BaseModel):
    doctor_id: int
    appointment_date: str  # YYYY-MM-DD
    appointment_time: str  # "10:30 AM"
    appointment_type: str
    reason: Optional[str] = None
    patient_dob: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: int
    user_id: int
    doctor_id: int
    appointment_date: str
    appointment_time: str
    appointment_type: str
    reason: Optional[str]
    patient_dob: Optional[str]
    status: str
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Additional fields for frontend
    doctorName: Optional[str] = None
    patientName: Optional[str] = None
    patient_email: Optional[str] = None
    patient_phone: Optional[str] = None

    class Config:
        from_attributes = True
