import logging
from datetime import date as date_type
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.db.models import Appointment, User, UserRole
from app.schemas.appointment import AppointmentCreate, AppointmentResponse
from app.core.security import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Response model for doctor list
# ---------------------------------------------------------------------------
class DoctorInfo(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    specialization: Optional[str] = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Response model for patient lookup (doctor / admin access)
# ---------------------------------------------------------------------------
class PatientInfo(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    role: str

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# GET /appointments/patients/{user_id}  – fetch one patient's basic info
#   Allowed: DOCTOR, ADMIN (patients cannot look up arbitrary users)
# ---------------------------------------------------------------------------
@router.get("/patients/{user_id}", response_model=PatientInfo)
async def get_patient_info(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return basic profile of a patient. Accessible to doctors and admins."""
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Only doctors and admins can view patient profiles",
        )

    patient = db.query(User).filter(User.id == user_id).first()
    if not patient:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found",
        )

    return PatientInfo(
        id=patient.id,
        first_name=patient.first_name,
        last_name=patient.last_name,
        email=patient.email,
        phone=patient.phone,
        role=patient.role.value,
    )


# ---------------------------------------------------------------------------
# GET /appointments/doctors  – list all doctors (any authenticated user)
# ---------------------------------------------------------------------------
@router.get("/doctors", response_model=List[DoctorInfo])
async def list_doctors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all users with the DOCTOR role."""
    doctors = db.query(User).filter(User.role == UserRole.DOCTOR).all()
    return doctors


# ---------------------------------------------------------------------------
# GET /appointments/check-availability
# ---------------------------------------------------------------------------
class AvailabilityResponse(BaseModel):
    available: bool
    message: str


@router.get("/check-availability", response_model=AvailabilityResponse)
async def check_availability(
    doctor_id: int = Query(..., description="Doctor's user ID"),
    appointment_date: str = Query(..., description="Date in YYYY-MM-DD format"),
    appointment_time: str = Query(..., description="Time slot e.g. '10:00 AM'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Check whether a doctor has an active (non-cancelled) appointment at the
    requested date/time slot.
    """
    # Validate doctor
    doctor = db.query(User).filter(User.id == doctor_id, User.role == UserRole.DOCTOR).first()
    if not doctor:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    # Validate date is not in the past
    try:
        requested_date = date_type.fromisoformat(appointment_date)
    except ValueError:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Invalid date format. Use YYYY-MM-DD")

    if requested_date < date_type.today():
        return AvailabilityResponse(available=False, message="Cannot book an appointment in the past")

    if requested_date.weekday() == 6:  # Sunday
        return AvailabilityResponse(available=False, message="Clinic is closed on Sundays")

    # Check for conflicting non-cancelled appointment
    conflict = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == appointment_date,
            Appointment.appointment_time == appointment_time,
            Appointment.status != "cancelled",
        )
        .first()
    )

    if conflict:
        return AvailabilityResponse(
            available=False,
            message=f"Dr. {doctor.first_name} {doctor.last_name} already has an appointment at {appointment_time} on {appointment_date}",
        )

    return AvailabilityResponse(
        available=True,
        message=f"Dr. {doctor.first_name} {doctor.last_name} is available at {appointment_time} on {appointment_date}",
    )


@router.post("", response_model=AppointmentResponse, status_code=http_status.HTTP_201_CREATED)
async def create_appointment(
    appointment: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new appointment for the current user (patient)
    """
    # Validate date is not in the past
    try:
        requested_date = date_type.fromisoformat(appointment.appointment_date)
    except ValueError:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD",
        )

    if requested_date < date_type.today():
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Cannot book an appointment in the past",
        )

    if requested_date.weekday() == 6:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Clinic is closed on Sundays",
        )

    # Verify doctor exists and is actually a doctor
    doctor = db.query(User).filter(User.id == appointment.doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )

    if doctor.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Selected user is not a doctor"
        )

    # Check slot is still free
    conflict = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == appointment.doctor_id,
            Appointment.appointment_date == appointment.appointment_date,
            Appointment.appointment_time == appointment.appointment_time,
            Appointment.status != "cancelled",
        )
        .first()
    )
    if conflict:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail=f"Dr. {doctor.first_name} {doctor.last_name} is already booked at {appointment.appointment_time} on {appointment.appointment_date}",
        )

    # Create appointment
    db_appointment = Appointment(
        user_id=current_user.id,
        doctor_id=appointment.doctor_id,
        appointment_date=appointment.appointment_date,
        appointment_time=appointment.appointment_time,
        appointment_type=appointment.appointment_type,
        reason=appointment.reason,
        patient_dob=appointment.patient_dob,
        status="scheduled"
    )
    
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    
    # Add doctor name for response
    response = AppointmentResponse.from_orm(db_appointment)
    response.doctorName = f"{doctor.first_name} {doctor.last_name}"
    response.patientName = f"{current_user.first_name} {current_user.last_name}"
    response.patient_email = current_user.email
    response.patient_phone = current_user.phone
    
    return response

@router.get("/my", response_model=List[AppointmentResponse])
async def get_my_appointments(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all appointments for the current user (paginated)."""
    appointments = (
        db.query(Appointment)
        .filter(Appointment.user_id == current_user.id)
        .order_by(Appointment.appointment_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    response_list = []
    for apt in appointments:
        doctor = db.query(User).filter(User.id == apt.doctor_id).first()
        response = AppointmentResponse.from_orm(apt)
        if doctor:
            response.doctorName = f"{doctor.first_name} {doctor.last_name}"
        response.patientName = f"{current_user.first_name} {current_user.last_name}"
        response.patient_email = current_user.email
        response.patient_phone = current_user.phone
        response_list.append(response)
    return response_list

@router.get("", response_model=List[AppointmentResponse])
async def get_all_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all appointments (admin/doctor view)
    """
    if current_user.role == UserRole.DOCTOR:
        # Doctors see their own appointments
        appointments = db.query(Appointment).filter(
            Appointment.doctor_id == current_user.id
        ).order_by(Appointment.appointment_date.desc()).all()
    elif current_user.role == UserRole.ADMIN:
        # Admins see all appointments
        appointments = db.query(Appointment).order_by(
            Appointment.appointment_date.desc()
        ).all()
    else:
        # Patients see their own
        appointments = db.query(Appointment).filter(
            Appointment.user_id == current_user.id
        ).order_by(Appointment.appointment_date.desc()).all()
    
    # Enrich with names
    response_list = []
    for apt in appointments:
        doctor = db.query(User).filter(User.id == apt.doctor_id).first()
        patient = db.query(User).filter(User.id == apt.user_id).first()
        
        response = AppointmentResponse.from_orm(apt)
        if doctor:
            response.doctorName = f"{doctor.first_name} {doctor.last_name}"
        if patient:
            response.patientName = f"{patient.first_name} {patient.last_name}"
            response.patient_email = patient.email
            response.patient_phone = patient.phone
        response_list.append(response)
    
    return response_list

@router.patch("/{appointment_id}/status", response_model=AppointmentResponse)
async def update_appointment_status(
    appointment_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update appointment status (for doctors/admins)
    """
    # Validate new_status values
    valid_statuses = ["scheduled", "in-progress", "completed", "cancelled", "no-show"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()

    if not appointment:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )

    # Only doctor, admin, or the patient can update
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR] and current_user.id != appointment.user_id:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this appointment"
        )

    appointment.status = new_status
    db.commit()
    db.refresh(appointment)

    return AppointmentResponse.from_orm(appointment)
