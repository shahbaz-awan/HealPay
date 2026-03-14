"""
Mock Integration API Endpoints
Exposes all mock services (eligibility, clearinghouse, ERA, payments, payers) via REST endpoints.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from app.db.database import get_db
from app.db.models import (Claim, Invoice, ClinicalEncounter, MedicalCode, User,
                            Payment, ClaimStatus, InvoiceStatus, EncounterStatus, Notification)
from app.core.security import get_current_user, require_roles
from app.db.models import UserRole
from app.services.mock import eligibility_service, clearinghouse_service, era_engine, payment_gateway
from app.services.mock.payer_database import get_all_payer_names

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Request / Response Models ────────────────────────────────────────────────

class EligibilityRequest(BaseModel):
    patient_name: str
    date_of_birth: str
    insurance_provider: str
    policy_number: str
    group_number: Optional[str] = ""
    date_of_service: Optional[str] = ""

class PaymentRequest(BaseModel):
    invoice_id: int
    card_number: str
    card_holder_name: str
    expiry_month: int
    expiry_year: int
    cvv: str


# ─── Payer List ───────────────────────────────────────────────────────────────

@router.get("/payers")
def list_payers():
    """Returns list of all supported insurance payers for dropdowns."""
    return {"payers": get_all_payer_names()}


# ─── Eligibility Verification (270/271) ───────────────────────────────────────

@router.post("/eligibility/verify")
def verify_eligibility(
    body: EligibilityRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Verify patient insurance eligibility in real-time.
    Simulates a 270/271 EDI transaction with the payer.
    """
    result = eligibility_service.verify_eligibility(
        patient_name=body.patient_name,
        date_of_birth=body.date_of_birth,
        insurance_provider=body.insurance_provider,
        policy_number=body.policy_number,
        group_number=body.group_number,
        date_of_service=body.date_of_service,
    )
    return result


# ─── Claim Submission to Clearinghouse ────────────────────────────────────────

@router.post("/claims/{claim_id}/submit-to-clearinghouse")
def submit_claim_to_clearinghouse(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit an existing claim to the mock clearinghouse.
    Returns 999-A ACK or clearinghouse rejection.
    Auto-schedules adjudication result.
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    enc = db.query(ClinicalEncounter).filter(ClinicalEncounter.id == claim.encounter_id).first()

    result = clearinghouse_service.submit_claim(
        claim_number=claim.claim_number,
        insurance_provider=claim.insurance_provider,
        total_amount=claim.total_amount,
        encounter_id=claim.encounter_id,
    )

    if result["accepted"]:
        # Store ICN on the claim
        claim.payer_control_number = result.get("icn")
        db.commit()

    return result


@router.post("/claims/{claim_id}/adjudicate")
def adjudicate_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BILLING, UserRole.ADMIN)),
):
    """
    Trigger mock adjudication for a submitted claim.
    Returns payer decision (approved/denied) and auto-posts payment if approved.
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.status not in (ClaimStatus.SUBMITTED, ClaimStatus.APPROVED):
        raise HTTPException(status_code=400, detail=f"Claim status '{claim.status}' cannot be adjudicated")

    result = clearinghouse_service.adjudicate_claim(
        claim_number=claim.claim_number,
        insurance_provider=claim.insurance_provider,
        total_amount=claim.total_amount,
    )

    # Fetch service lines for ERA
    codes = db.query(MedicalCode).filter(
        MedicalCode.encounter_id == claim.encounter_id,
        MedicalCode.code_type == "CPT"
    ).all()
    service_lines = [{"code": c.code, "description": c.description, "units": c.units or 1} for c in codes]

    if result["decision"] == "approved":
        claim.status = ClaimStatus.PAID
        claim.denial_reason_code = None
        from datetime import datetime as _dt
        claim.adjudication_date = _dt.utcnow()

        # Auto-post insurance payment to invoice
        invoice = db.query(Invoice).filter(Invoice.encounter_id == claim.encounter_id).first()
        if invoice and invoice.status not in (InvoiceStatus.PAID, InvoiceStatus.CANCELLED):
            ins_pay = Payment(
                invoice_id=invoice.id,
                amount=result["paid_amount"],
                payment_method="Insurance EFT",
                payer_type="primary_insurance",
                check_number=result.get("check_number"),
                notes=f"Auto-posted from ERA {result.get('remittance_advice')} — Claim #{claim.claim_number}",
            )
            db.add(ins_pay)
            invoice.amount_paid = round(invoice.amount_paid + result["paid_amount"], 2)
            invoice.balance_due = max(round(invoice.total_amount - invoice.amount_paid, 2), 0.0)
            if invoice.balance_due <= 0:
                invoice.status = InvoiceStatus.PAID

    else:
        claim.status = ClaimStatus.DENIED
        claim.denial_reason_code = result["carc_code"]
        from datetime import datetime as _dt
        claim.adjudication_date = _dt.utcnow()

    db.commit()

    # Notify patient
    enc = db.query(ClinicalEncounter).filter(ClinicalEncounter.id == claim.encounter_id).first()
    if enc:
        ntype = "success" if result["decision"] == "approved" else "error"
        notif_msg = (
            f"Your claim #{claim.claim_number} was approved. ${result.get('paid_amount',0):.2f} paid by insurance."
            if result["decision"] == "approved"
            else f"Your claim #{claim.claim_number} was denied. Reason: {result.get('carc_description','See remittance')}."
        )
        db.add(Notification(user_id=enc.patient_id, title=f"Claim {result['decision'].title()}", message=notif_msg, type=ntype, link="/patient/dashboard"))
        db.commit()

    # Generate ERA
    era = era_engine.generate_era(
        claim_number=claim.claim_number,
        insurance_provider=claim.insurance_provider,
        billed_amount=claim.total_amount,
        paid_amount=result.get("paid_amount", 0.0),
        patient_responsibility=result.get("patient_responsibility", claim.total_amount),
        carc_code=result.get("carc_code", "CO-45"),
        decision=result["decision"],
        service_lines=service_lines,
    )

    return {**result, "era": era}


# ─── ERA Retrieval ─────────────────────────────────────────────────────────────

@router.get("/claims/{claim_id}/era")
def get_claim_era(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the generated ERA document for an adjudicated claim."""
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.status not in (ClaimStatus.PAID, ClaimStatus.DENIED):
        raise HTTPException(status_code=400, detail="ERA is only available after adjudication")

    invoice = db.query(Invoice).filter(Invoice.encounter_id == claim.encounter_id).first()
    paid_amount = (claim.total_amount - (claim.patient_responsibility or 0)) if claim.status == ClaimStatus.PAID else 0.0
    patient_resp = claim.patient_responsibility or claim.total_amount

    return era_engine.generate_era(
        claim_number=claim.claim_number,
        insurance_provider=claim.insurance_provider,
        billed_amount=claim.total_amount,
        paid_amount=paid_amount,
        patient_responsibility=patient_resp,
        carc_code=claim.denial_reason_code or "CO-45",
        decision="paid" if claim.status == ClaimStatus.PAID else "denied",
    )


# ─── Patient Payment ──────────────────────────────────────────────────────────

@router.post("/invoices/{invoice_id}/pay")
def pay_invoice(
    invoice_id: int,
    body: PaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Process patient payment for an invoice using mock payment gateway.
    Supports Stripe-style test card numbers.
    """
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Patients can only pay their own invoices
    if current_user.role == UserRole.PATIENT and invoice.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(status_code=400, detail="This invoice is already fully paid")

    # Process payment
    max_amount = invoice.balance_due
    result = payment_gateway.process_payment(
        invoice_id=invoice_id,
        amount=max_amount,
        card_number=body.card_number,
        card_holder_name=body.card_holder_name,
        expiry_month=body.expiry_month,
        expiry_year=body.expiry_year,
        cvv=body.cvv,
    )

    if result["success"]:
        # Post payment to invoice
        payment = Payment(
            invoice_id=invoice.id,
            amount=max_amount,
            payment_method=f"Card ({result['card_brand']} ****{result['last4']})",
            payer_type="patient",
            transaction_id=result["transaction_id"],
            notes=f"Online payment — txn {result['transaction_id']}",
        )
        db.add(payment)
        invoice.amount_paid = round(invoice.amount_paid + max_amount, 2)
        invoice.balance_due = max(round(invoice.total_amount - invoice.amount_paid, 2), 0.0)
        if invoice.balance_due <= 0:
            invoice.status = InvoiceStatus.PAID

        # Notify patient
        db.add(Notification(
            user_id=current_user.id,
            title="Payment Successful",
            message=f"Payment of ${max_amount:.2f} processed. Transaction ID: {result['transaction_id']}",
            type="success",
        ))
        db.commit()

    return result


@router.get("/payment/test-cards")
def get_test_cards():
    """Return test card hints to display in the payment UI."""
    return {"test_cards": payment_gateway.get_test_cards_info()}


# ─── AR Aging Report ──────────────────────────────────────────────────────────

@router.get("/reports/ar-aging")
def get_ar_aging_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BILLING, UserRole.ADMIN)),
):
    """
    Returns AR Aging Report broken into 0-30, 31-60, 61-90, 90+ day buckets.
    Essential for medical billing collections management.
    """
    from datetime import date
    today = date.today()
    buckets = {"0_30": [], "31_60": [], "61_90": [], "over_90": []}
    totals = {"0_30": 0.0, "31_60": 0.0, "61_90": 0.0, "over_90": 0.0}

    invoices = db.query(Invoice).filter(
        Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE])
    ).all()

    for inv in invoices:
        if not inv.due_date:
            continue
        try:
            due = date.fromisoformat(str(inv.due_date))
        except Exception:
            continue
        days_past = (today - due).days
        balance = inv.balance_due or 0.0
        patient = db.query(User).filter(User.id == inv.patient_id).first()
        entry = {
            "invoice_id": inv.id,
            "invoice_number": inv.invoice_number,
            "patient_name": f"{patient.first_name} {patient.last_name}" if patient else "Unknown",
            "due_date": inv.due_date,
            "balance_due": balance,
            "days_past_due": max(0, days_past),
        }
        if days_past <= 30:
            buckets["0_30"].append(entry); totals["0_30"] += balance
        elif days_past <= 60:
            buckets["31_60"].append(entry); totals["31_60"] += balance
        elif days_past <= 90:
            buckets["61_90"].append(entry); totals["61_90"] += balance
        else:
            buckets["over_90"].append(entry); totals["over_90"] += balance

    grand_total = sum(totals.values())
    return {
        "generated_at": today.isoformat(),
        "grand_total_outstanding": round(grand_total, 2),
        "buckets": {
            "0_30_days":  {"total": round(totals["0_30"], 2),   "count": len(buckets["0_30"]),   "invoices": buckets["0_30"]},
            "31_60_days": {"total": round(totals["31_60"], 2),  "count": len(buckets["31_60"]),  "invoices": buckets["31_60"]},
            "61_90_days": {"total": round(totals["61_90"], 2),  "count": len(buckets["61_90"]),  "invoices": buckets["61_90"]},
            "over_90_days":{"total": round(totals["over_90"], 2),"count": len(buckets["over_90"]),"invoices": buckets["over_90"]},
        },
    }


# ─── Denial Management ────────────────────────────────────────────────────────

@router.post("/claims/{claim_id}/appeal")
def appeal_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BILLING, UserRole.ADMIN)),
):
    """Mark a denied claim as under appeal."""
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status != ClaimStatus.DENIED:
        raise HTTPException(status_code=400, detail="Only denied claims can be appealed")
    claim.appeal_status = "appealing"
    db.commit()
    return {"claim_id": claim_id, "appeal_status": "appealing", "message": "Claim marked as under appeal."}


@router.post("/claims/{claim_id}/resubmit")
def resubmit_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BILLING, UserRole.ADMIN)),
):
    """Resubmit a denied/appealing claim as a corrected claim."""
    import secrets, string
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status not in (ClaimStatus.DENIED, ClaimStatus.APPEALING):
        raise HTTPException(status_code=400, detail="Only denied or appealing claims can be resubmitted")

    # Create corrected claim
    new_number = "CLM-C" + "".join(secrets.choice(string.digits) for _ in range(7))
    corrected = Claim(
        encounter_id=claim.encounter_id,
        claim_number=new_number,
        insurance_provider=claim.insurance_provider,
        total_amount=claim.total_amount,
        patient_responsibility=claim.patient_responsibility,
        status=ClaimStatus.SUBMITTED,
        claim_type="corrected",
        cms1500_data=claim.cms1500_data,
    )
    db.add(corrected)
    claim.appeal_status = "resubmitted"
    db.commit()
    db.refresh(corrected)
    return {
        "original_claim_id": claim_id,
        "corrected_claim_id": corrected.id,
        "corrected_claim_number": new_number,
        "status": "submitted",
        "message": f"Corrected claim #{new_number} submitted successfully.",
    }
