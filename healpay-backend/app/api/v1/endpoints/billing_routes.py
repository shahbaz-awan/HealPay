from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, aliased
from app.db.database import get_db
from app.services.billing import BillingService
from app.services.claim_risk_analyzer import analyze_claim_risk
from app.core.security import get_current_user, require_roles
from app.db.models import User, UserRole, ClinicalEncounter, MedicalCode, Invoice, Claim, Notification
from app.schemas.billing import InvoiceCreate, PaymentCreate, ClaimCreate
from typing import List, Optional, Any, Dict
import secrets
import string
from datetime import date as _date

router = APIRouter()
billing_service = BillingService()


def _create_notification(db: Session, user_id: int, title: str, message: str,
                         ntype: str = "info", link: str = None) -> None:
    """Helper to push a notification record."""
    noti = Notification(user_id=user_id, title=title, message=message,
                        type=ntype, link=link)
    db.add(noti)
    db.commit()

_billing_staff = require_roles(UserRole.BILLING, UserRole.ADMIN)

@router.get("/stats")
def get_billing_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(_billing_staff)
):
    """
    Get billing dashboard statistics (Revenue, Outstanding, etc.)
    """
    return billing_service.get_dashboard_stats(db)

@router.get("/invoices/recent")
def get_recent_invoices(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(_billing_staff)
):
    """
    Get recent invoices (billing staff / admin only)
    """
    return billing_service.get_recent_invoices(db, limit)

@router.get("/invoices/my")
def get_my_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all invoices for the currently authenticated patient.
    Must be defined BEFORE /invoices/{invoice_id} to avoid shadowing.
    """
    invoices = (
        db.query(Invoice)
        .filter(Invoice.patient_id == current_user.id)
        .order_by(Invoice.created_at.desc())
        .all()
    )
    today = __import__('datetime').date.today().isoformat()
    return [
        {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "total_amount": inv.total_amount,
            "amount_paid": inv.amount_paid,
            "balance_due": inv.balance_due,
            "status": inv.status if not (inv.status == "issued" and inv.due_date and inv.due_date < today) else "overdue",
            "issue_date": inv.issue_date,
            "due_date": inv.due_date,
        }
        for inv in invoices
    ]

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


# CPT code standard rates (simplified industry price schedule)
CPT_RATES: Dict[str, float] = {
    "99201": 68.0, "99202": 109.0, "99203": 148.0, "99204": 214.0, "99205": 267.0,
    "99211": 22.0, "99212": 68.0, "99213": 109.0, "99214": 148.0, "99215": 214.0,
    "99221": 188.0, "99222": 235.0, "99223": 315.0,
    "99231": 68.0,  "99232": 109.0, "99233": 148.0,
    "99281": 35.0,  "99282": 68.0,  "99283": 109.0, "99284": 148.0, "99285": 214.0,
    "99241": 68.0,  "99242": 109.0, "99243": 148.0, "99244": 214.0, "99245": 267.0,
    "93000": 21.0,  "93005": 15.0,  "93010": 12.0,
    "85025": 10.0,  "80053": 14.0,  "80061": 18.0,  "82947": 6.0,
    "71046": 85.0,  "73721": 320.0, "70553": 750.0,
}
DEFAULT_CPT_RATE = 150.0


@router.post("/invoices/from-encounter/{encounter_id}")
def create_invoice_from_encounter(
    encounter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Auto-generate an invoice from a coded encounter.
    Looks up assigned CPT codes, calculates billable total,
    and creates an Invoice record linked to the encounter.
    """
    encounter = db.query(ClinicalEncounter).filter(ClinicalEncounter.id == encounter_id).first()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")

    # Check for duplicate invoice
    existing = db.query(Invoice).filter(Invoice.encounter_id == encounter_id).first()
    if existing:
        # Return the existing invoice with a flag
        patient = db.query(User).filter(User.id == encounter.patient_id).first()
        return {
            "id": existing.id,
            "invoice_number": existing.invoice_number,
            "total_amount": existing.total_amount,
            "balance_due": existing.balance_due,
            "amount_paid": existing.amount_paid,
            "status": existing.status,
            "issue_date": existing.issue_date,
            "due_date": existing.due_date,
            "patient_name": f"{patient.first_name} {patient.last_name}" if patient else "Unknown",
            "already_existed": True,
        }

    # Fetch CPT codes assigned to this encounter
    cpt_codes = db.query(MedicalCode).filter(
        MedicalCode.encounter_id == encounter_id,
        MedicalCode.code_type == "CPT"
    ).all()

    if not cpt_codes:
        raise HTTPException(
            status_code=400,
            detail="No CPT codes have been assigned to this encounter. "
                   "Please have the medical coder assign CPT codes first."
        )

    # Calculate total using the CPT rate schedule
    line_items = []
    total = 0.0
    for code in cpt_codes:
        rate = CPT_RATES.get(code.code.strip(), DEFAULT_CPT_RATE)
        line_items.append({"code": code.code, "description": code.description, "amount": rate})
        total += rate

    # Apply 30% insurance adjustment (common in medical billing demos)
    patient_responsibility = round(total * 0.30, 2)

    invoice_data = {
        "patient_id": encounter.patient_id,
        "encounter_id": encounter_id,
        "amount": patient_responsibility,
    }

    new_invoice = billing_service.create_invoice(db, invoice_data)

    # Update encounter status to sent_to_biller (it's now been invoiced)
    encounter.status = "sent_to_biller"
    db.commit()

    patient = db.query(User).filter(User.id == encounter.patient_id).first()

    return {
        "id": new_invoice.id,
        "invoice_number": new_invoice.invoice_number,
        "total_amount": new_invoice.total_amount,
        "balance_due": new_invoice.balance_due,
        "amount_paid": new_invoice.amount_paid,
        "status": new_invoice.status,
        "issue_date": new_invoice.issue_date,
        "due_date": new_invoice.due_date,
        "patient_name": f"{patient.first_name} {patient.last_name}" if patient else "Unknown",
        "line_items": line_items,
        "gross_total": round(total, 2),
        "insurance_adjustment": round(total - patient_responsibility, 2),
        "already_existed": False,
    }


@router.get("/invoices/{invoice_id}")
def get_invoice_detail(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get details of a single invoice with line items from linked encounter codes."""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Patients can only view their own invoices; billing/admin can view any
    if current_user.role == UserRole.PATIENT and invoice.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    patient = db.query(User).filter(User.id == invoice.patient_id).first()

    # Fetch line items if encounter exists
    line_items = []
    if invoice.encounter_id:
        codes = db.query(MedicalCode).filter(MedicalCode.encounter_id == invoice.encounter_id).all()
        line_items = [{"code": c.code, "type": c.code_type, "description": c.description} for c in codes]

    today = __import__('datetime').date.today().isoformat()
    effective_status = invoice.status
    if invoice.status == "issued" and invoice.due_date and invoice.due_date < today:
        effective_status = "overdue"

    return {
        "id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "patient_id": invoice.patient_id,
        "patient_name": f"{patient.first_name} {patient.last_name}" if patient else "Unknown",
        "encounter_id": invoice.encounter_id,
        "total_amount": invoice.total_amount,
        "amount_paid": invoice.amount_paid,
        "balance_due": invoice.balance_due,
        "status": effective_status,
        "issue_date": invoice.issue_date,
        "due_date": invoice.due_date,
        "line_items": line_items,
    }


@router.get("/encounters/ready")
def get_ready_to_bill_encounters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all encounters that have been coded and are ready for billing
    """
    PatientUser = aliased(User, name="patient")
    DoctorUser  = aliased(User, name="doctor")

    rows = (
        db.query(ClinicalEncounter, PatientUser, DoctorUser)
        .join(PatientUser, PatientUser.id == ClinicalEncounter.patient_id)
        .join(DoctorUser,  DoctorUser.id  == ClinicalEncounter.doctor_id)
        .filter(ClinicalEncounter.status.in_(['coded', 'sent_to_biller']))
        .all()
    )

    return [
        {
            "id": enc.id,
            "encounter_date": enc.encounter_date,
            "patient_name": f"{pat.first_name} {pat.last_name}",
            "doctor_name":  f"{doc.first_name} {doc.last_name}",
            "type": enc.encounter_type,
            "status": enc.status,
        }
        for enc, pat, doc in rows
    ]

@router.get("/claims/recent")
def get_recent_claims(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(_billing_staff)
):
    """Get recent insurance claims (billing staff / admin only)."""
    claims = db.query(Claim).order_by(Claim.submitted_at.desc()).offset(skip).limit(limit).all()
    results = []
    for claim in claims:
        enc = db.query(ClinicalEncounter).filter(ClinicalEncounter.id == claim.encounter_id).first()
        patient = db.query(User).filter(User.id == enc.patient_id).first() if enc else None
        results.append({
            "id": claim.id,
            "claim_number": claim.claim_number,
            "insurance_provider": claim.insurance_provider,
            "total_amount": claim.total_amount,
            "patient_responsibility": claim.patient_responsibility,
            "status": claim.status,
            "submitted_at": claim.submitted_at,
            "patient_name": f"{patient.first_name} {patient.last_name}" if patient else "Unknown",
            "encounter_id": claim.encounter_id,
        })
    return results


@router.post("/claims")
def create_claim(
    claim_data: ClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_billing_staff)
):
    """Create an insurance claim from a CMS-1500 form submission."""
    import json as _json
    # Verify encounter exists
    encounter = db.query(ClinicalEncounter).filter(
        ClinicalEncounter.id == claim_data.encounter_id
    ).first()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")

    # Guard against duplicate
    existing = db.query(Claim).filter(Claim.encounter_id == claim_data.encounter_id).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"A claim already exists for this encounter (#{existing.claim_number}).",
        )

    # Generate unique claim number
    claim_number = "CLM-" + "".join(secrets.choice(string.digits) for _ in range(8))
    patient_resp = claim_data.patient_responsibility if claim_data.patient_responsibility is not None \
        else round(claim_data.total_amount * 0.30, 2)

    new_claim = Claim(
        encounter_id=claim_data.encounter_id,
        claim_number=claim_number,
        insurance_provider=claim_data.insurance_provider,
        total_amount=claim_data.total_amount,
        patient_responsibility=patient_resp,
        status="submitted",
    )
    db.add(new_claim)

    # Update encounter status
    encounter.status = "claim_submitted"
    db.commit()
    db.refresh(new_claim)

    # Notify the patient
    patient = db.query(User).filter(User.id == encounter.patient_id).first()
    if patient:
        _create_notification(
            db, patient.id,
            title="Insurance Claim Submitted",
            message=f"Claim #{claim_number} has been submitted to {claim_data.insurance_provider}.",
            ntype="info",
            link="/patient/dashboard",
        )

    return {
        "id": new_claim.id,
        "claim_number": new_claim.claim_number,
        "status": new_claim.status,
        "encounter_id": new_claim.encounter_id,
        "insurance_provider": new_claim.insurance_provider,
        "total_amount": new_claim.total_amount,
        "patient_responsibility": new_claim.patient_responsibility,
        "submitted_at": new_claim.submitted_at,
    }


@router.get("/claims/{claim_id}")
def get_claim_detail(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_billing_staff)
):
    """Get a single claim by ID."""
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    enc = db.query(ClinicalEncounter).filter(ClinicalEncounter.id == claim.encounter_id).first()
    patient = db.query(User).filter(User.id == enc.patient_id).first() if enc else None
    return {
        "id": claim.id,
        "claim_number": claim.claim_number,
        "encounter_id": claim.encounter_id,
        "insurance_provider": claim.insurance_provider,
        "total_amount": claim.total_amount,
        "patient_responsibility": claim.patient_responsibility,
        "status": claim.status,
        "submitted_at": claim.submitted_at,
        "updated_at": claim.updated_at,
        "patient_name": f"{patient.first_name} {patient.last_name}" if patient else "Unknown",
    }


@router.put("/claims/{claim_id}/status")
def update_claim_status(
    claim_id: int,
    body: Dict[str, str],
    db: Session = Depends(get_db),
    current_user: User = Depends(_billing_staff)
):
    """Update a claim's status (approved, denied, paid)."""
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    allowed = {"submitted", "approved", "denied", "paid"}
    new_status = body.get("status", "").lower()
    if new_status not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {allowed}")

    claim.status = new_status
    db.commit()

    # Notify patient of status change
    enc = db.query(ClinicalEncounter).filter(ClinicalEncounter.id == claim.encounter_id).first()
    if enc:
        status_messages = {
            "approved": ("Claim Approved", "success"),
            "denied": ("Claim Denied", "error"),
            "paid": ("Claim Paid", "success"),
        }
        if new_status in status_messages:
            title, ntype = status_messages[new_status]
            _create_notification(
                db, enc.patient_id,
                title=f"Insurance {title}",
                message=f"Your claim #{claim.claim_number} has been {new_status}.",
                ntype=ntype,
                link="/patient/dashboard",
            )

    return {"id": claim.id, "claim_number": claim.claim_number, "status": claim.status}

# ── Claim Risk Analyzer ─────────────────────────────────────────────────────


@router.post("/analyze-claim-risk")
def analyze_claim_risk_endpoint(
    form_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Validates a CMS-1500 form payload and returns a risk assessment
    with severity-coded issues, risk score, and actionable suggestions.
    """
    result = analyze_claim_risk(form_data)
    return result

