"""
Billing Schemas — Pydantic models for request/response validation.
Centralises billing-related schema definitions that were previously
inlined inside billing_routes.py.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


# ─── Invoice ─────────────────────────────────────────────────────────────────

class InvoiceCreate(BaseModel):
    patient_id: int
    encounter_id: Optional[int] = None
    claim_id: Optional[int] = None
    amount: float


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    patient_id: int
    patient_name: Optional[str] = None
    encounter_id: Optional[int] = None
    total_amount: float
    amount_paid: float
    balance_due: float
    status: str
    issue_date: str
    due_date: str

    class Config:
        from_attributes = True


# ─── Payment ─────────────────────────────────────────────────────────────────

class PaymentCreate(BaseModel):
    invoice_id: int
    amount: float
    payment_method: str
    transaction_id: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    invoice_id: int
    amount: float
    payment_method: str
    transaction_id: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# ─── Claim ───────────────────────────────────────────────────────────────────

class ClaimCreate(BaseModel):
    encounter_id: int
    insurance_provider: str
    total_amount: float
    patient_responsibility: Optional[float] = None
    # CMS-1500 field snapshot (serialised as JSON text in DB)
    cms1500_data: Optional[dict] = None


class ClaimResponse(BaseModel):
    id: int
    encounter_id: int
    claim_number: str
    insurance_provider: str
    total_amount: float
    patient_responsibility: Optional[float] = None
    status: str
    claim_type: Optional[str] = None
    billing_provider_npi: Optional[str] = None
    rendering_provider_npi: Optional[str] = None
    denial_reason_code: Optional[str] = None
    adjudication_date: Optional[str] = None
    payer_control_number: Optional[str] = None
    cms1500_data: Optional[dict] = None

    class Config:
        from_attributes = True


# ─── Notification ─────────────────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    link: Optional[str] = None

    class Config:
        from_attributes = True
