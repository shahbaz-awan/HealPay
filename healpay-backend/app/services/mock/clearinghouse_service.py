"""
Mock Clearinghouse Service
Simulates claim submission to a real clearinghouse (e.g., Waystar, Change Healthcare).
Returns realistic 999 ACK/KREJ responses and schedules auto-adjudication.
"""
import hashlib
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List
from app.services.mock.payer_database import get_payer, CARC_DESCRIPTIONS


def _stable_rand(seed: str, mod: int) -> int:
    """Deterministic integer from seed string."""
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    return h % mod


def _pick_denial_code(payer_key: str, claim_number: str) -> str:
    """Pick a payer-specific denial code deterministically."""
    from app.services.mock.payer_database import PAYERS
    payer_data = PAYERS.get(payer_key)
    if payer_data and payer_data["common_carc_codes"]:
        codes = payer_data["common_carc_codes"]
        idx = _stable_rand(claim_number + payer_key, len(codes))
        return codes[idx]
    return "CO-16"


def validate_claim_for_submission(claim_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates a CMS-1500 claim before submission to clearinghouse.
    Returns list of errors and warnings (like a real clearinghouse scrubber).
    """
    errors = []
    warnings = []

    # Required field checks
    required_fields = [
        ("insurance_provider", "Insurance provider is required"),
        ("total_amount", "Total billed amount is required"),
        ("encounter_id", "Encounter ID is required"),
    ]
    for field, msg in required_fields:
        if not claim_data.get(field):
            errors.append({"code": "MISS-001", "field": field, "message": msg, "severity": "error"})

    # Amount check
    total = claim_data.get("total_amount", 0)
    if total and float(total) <= 0:
        errors.append({"code": "AMT-001", "field": "total_amount", "message": "Billed amount must be greater than zero", "severity": "error"})
    if total and float(total) > 100000:
        warnings.append({"code": "AMT-002", "field": "total_amount", "message": "Unusually high billed amount — verify before submission", "severity": "warning"})

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "summary": f"{len(errors)} error(s), {len(warnings)} warning(s)",
    }


def submit_claim(
    claim_number: str,
    insurance_provider: str,
    total_amount: float,
    encounter_id: int,
    cms1500_data: Dict = None,
) -> Dict[str, Any]:
    """
    Simulates claim submission to clearinghouse.
    Returns 999 ACK (accepted) or real-sounding rejection with ICN.
    """
    payer = get_payer(insurance_provider)
    payer_key = payer["key"] if payer else "UNKNWN"
    payer_name = payer["name"] if payer else insurance_provider
    denial_rate = payer["denial_rate"] if payer else 0.15

    # Generate a deterministic ICN (Insurance Control Number)
    seed = f"{claim_number}|{insurance_provider}|{encounter_id}"
    icn = f"1{_stable_rand(seed, 10**9):09d}0"

    # Clearinghouse rejection (5% chance — different from payer denial)
    rejection_roll = _stable_rand(seed + "rej", 100)
    if rejection_roll < 5:
        return {
            "accepted": False,
            "status": "rejected_by_clearinghouse",
            "ack_code": "999-R",
            "icn": None,
            "payer_name": payer_name,
            "rejection_reason": "Claim rejected by clearinghouse: Missing or invalid data elements in Loop 2300.",
            "error_segments": ["CLM01", "NM1*IL"],
            "resubmission_instructions": "Correct the identified segments and resubmit within 24 hours.",
            "submitted_at": datetime.utcnow().isoformat(),
        }

    # Determine processing time for auto-adjudication
    processing_days = payer["avg_processing_days"] if payer else 14
    adjudication_due = datetime.utcnow() + timedelta(days=processing_days)

    return {
        "accepted": True,
        "status": "submitted",
        "ack_code": "999-A",
        "icn": icn,
        "payer_id": payer["payer_id"] if payer else "UNKNWN",
        "payer_name": payer_name,
        "claim_number": claim_number,
        "billed_amount": total_amount,
        "expected_adjudication_date": adjudication_due.date().isoformat(),
        "processing_days": processing_days,
        "submitted_at": datetime.utcnow().isoformat(),
        "message": f"Claim {claim_number} accepted by clearinghouse. Forwarded to {payer_name}.",
    }


def adjudicate_claim(
    claim_number: str,
    insurance_provider: str,
    total_amount: float,
    patient_dob: str = "",
) -> Dict[str, Any]:
    """
    Simulates payer adjudication result (what comes back as ERA/835).
    Deterministic — same claim always gets same result.
    """
    payer = get_payer(insurance_provider)
    payer_name = payer["name"] if payer else insurance_provider
    payer_key = payer["key"] if payer else "UNKNWN"
    denial_rate = payer["denial_rate"] if payer else 0.15
    contracted_rate_pct = payer["contracted_rate_pct"] if payer else 0.80

    seed = f"{claim_number}|{insurance_provider}"
    roll = _stable_rand(seed + "adj", 100)

    # Determine outcome based on payer denial rate
    is_denied = roll < int(denial_rate * 100)

    if is_denied:
        carc_code = _pick_denial_code(payer_key, claim_number)
        return {
            "decision": "denied",
            "claim_number": claim_number,
            "payer_name": payer_name,
            "carc_code": carc_code,
            "carc_description": CARC_DESCRIPTIONS.get(carc_code, "See remittance advice"),
            "rarc_code": "N290",
            "billed_amount": total_amount,
            "allowed_amount": 0.0,
            "paid_amount": 0.0,
            "patient_responsibility": total_amount,  # Full amount goes to patient
            "denial_reason": CARC_DESCRIPTIONS.get(carc_code),
            "appeal_deadline_days": 60,
            "adjudication_date": datetime.utcnow().date().isoformat(),
        }

    # Approved — calculate payments
    allowed_amount = round(total_amount * contracted_rate_pct, 2)
    contractual_adjustment = round(total_amount - allowed_amount, 2)  # CO-45
    copay = round(allowed_amount * 0.20, 2)   # Patient pays 20% after deductible
    paid_amount = round(allowed_amount - copay, 2)

    return {
        "decision": "approved",
        "claim_number": claim_number,
        "payer_name": payer_name,
        "billed_amount": total_amount,
        "allowed_amount": allowed_amount,
        "contractual_adjustment": contractual_adjustment,  # CO-45
        "paid_amount": paid_amount,
        "patient_responsibility": copay,
        "carc_code": "CO-45",
        "carc_description": "Charge exceeds fee schedule/maximum allowable (contractual adjustment).",
        "check_number": f"EFT{_stable_rand(seed + 'chk', 10**7):07d}",
        "adjudication_date": datetime.utcnow().date().isoformat(),
        "remittance_advice": f"ERA-{_stable_rand(seed + 'era', 10**6):06d}",
    }
