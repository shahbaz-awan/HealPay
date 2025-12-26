from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db.models import Appointment, User
from app.schemas.appointment import AppointmentCreate, AppointmentResponse
from app.core.security import get_current_user

router = APIRouter()

@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new appointment for the current user (patient)
    """
    # Verify doctor exists and is actually a doctor
    doctor = db.query(User).filter(User.id == appointment.doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    if doctor.role != "DOCTOR":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected user is not a doctor"
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
    
    return response

@router.get("/my", response_model=List[AppointmentResponse])
async def get_my_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all appointments for the current user
    """
    appointments = db.query(Appointment).filter(
        Appointment.user_id == current_user.id
    ).order_by(Appointment.appointment_date.desc()).all()
    
    # Enrich with doctor names
    response_list = []
    for apt in appointments:
        doctor = db.query(User).filter(User.id == apt.doctor_id).first()
        response = AppointmentResponse.from_orm(apt)
        if doctor:
            response.doctorName = f"{doctor.first_name} {doctor.last_name}"
        response.patientName = f"{current_user.first_name} {current_user.last_name}"
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
    if current_user.role == "DOCTOR":
        # Doctors see their own appointments
        appointments = db.query(Appointment).filter(
            Appointment.doctor_id == current_user.id
        ).order_by(Appointment.appointment_date.desc()).all()
    elif current_user.role == "ADMIN":
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
        response_list.append(response)
    
    return response_list

@router.patch("/{appointment_id}/status", response_model=AppointmentResponse)
async def update_appointment_status(
    appointment_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update appointment status (for doctors/admins)
    """
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Only doctor, admin, or the patient can update
    if current_user.role not in ["ADMIN", "DOCTOR"] and current_user.id != appointment.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this appointment"
        )
    
    appointment.status = status
    db.commit()
    db.refresh(appointment)
    
    return AppointmentResponse.from_orm(appointment)
