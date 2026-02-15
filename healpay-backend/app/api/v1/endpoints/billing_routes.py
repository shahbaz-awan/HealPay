from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.billing import BillingService
from app.core.security import get_current_user
from app.db.models import User, ClinicalEncounter
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()
billing_service = BillingService()

# Pydantic Schemas for Request/Response
class InvoiceCreate(BaseModel):
    patient_id: int
    encounter_id: Optional[int] = None
    claim_id: Optional[int] = None
    amount: float

class PaymentCreate(BaseModel):
    invoice_id: int
    amount: float
    payment_method: str
    transaction_id: Optional[str] = None
    notes: Optional[str] = None

@router.get("/stats")
def get_billing_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get billing dashboard statistics (Revenue, Outstanding, etc.)
    """
    return billing_service.get_dashboard_stats(db)

@router.get("/invoices/recent")
def get_recent_invoices(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get recent invoices
    """
    return billing_service.get_recent_invoices(db, limit)

@router.post("/invoices")
def create_invoice(
    invoice_data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a new invoice
    """
    return billing_service.create_invoice(db, invoice_data.dict())

@router.post("/payments")
def record_payment(
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Record a payment
    """
    return billing_service.record_payment(db, payment_data.dict())

@router.get("/encounters/ready")
def get_ready_to_bill_encounters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all encounters that have been coded and are ready for billing
    """
    # Assuming 'coded' is the status for encounters ready to be billed
    encounters = db.query(ClinicalEncounter).filter(
        ClinicalEncounter.status.in_(['coded', 'sent_to_biller'])
    ).all()
    
    # We might want to join with Patient and Doctor to get names
    # For now, let's return the simplified list and enrich if needed
    # Or rely on the frontend to fetch details or use a detailed query here.
    
    # Let's do a quick enrichment:
    results = []
    for enc in encounters:
        patient = db.query(User).filter(User.id == enc.patient_id).first()
        doctor = db.query(User).filter(User.id == enc.doctor_id).first()
        
        results.append({
            "id": enc.id,
            "encounter_date": enc.encounter_date,
            "patient_name": f"{patient.first_name} {patient.last_name}" if patient else "Unknown",
            "doctor_name": f"{doctor.first_name} {doctor.last_name}" if doctor else "Unknown",
            "type": enc.encounter_type,
            "status": enc.status
        })
        
    return results

@router.get("/claims/recent")
def get_recent_claims(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get recent claims (Placeholder for now until claim service is fully fleshed out)
    """
    # For now returning empty list or simple query if needed
    # We will implement full claim service later
    return []

print(f"Billing router initialized with {len(router.routes)} routes")
for r in router.routes:
    print(f" - {r.path}")
