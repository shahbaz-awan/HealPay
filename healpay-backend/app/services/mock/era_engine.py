"""
Mock ERA Engine (Electronic Remittance Advice / 835)
Generates a realistic ERA document when a claim is adjudicated.
Mirrors what a real 835 EDI transaction would contain.
"""
import hashlib
from datetime import datetime
from typing import Dict, Any, List
from app.services.mock.payer_database import get_payer, CARC_DESCRIPTIONS


def _stable_val(seed: str, mod: int) -> int:
    return int(hashlib.md5(seed.encode()).hexdigest(), 16) % mod


def generate_era(
    claim_number: str,
    insurance_provider: str,
    billed_amount: float,
    paid_amount: float,
    patient_responsibility: float,
    carc_code: str = "CO-45",
    decision: str = "approved",
    service_lines: List[Dict] = None,
) -> Dict[str, Any]:
    """
    Generates a structured ERA (835) response document.
    This is what a biller would receive electronically after payer adjudication.
    """
    payer = get_payer(insurance_provider)
    payer_name = payer["name"] if payer else insurance_provider
    payer_id = payer["payer_id"] if payer else "UNKNWN"

    seed = f"{claim_number}|{insurance_provider}"
    era_id = f"ERA-{_stable_val(seed, 10**6):06d}"
    check_num = f"EFT{_stable_val(seed + 'check', 10**8):08d}"
    icn = f"1{_stable_val(seed + 'icn', 10**9):09d}0"

    contractual_adj = round(billed_amount - (paid_amount + patient_responsibility), 2)
    if contractual_adj < 0:
        contractual_adj = 0.0

    # Build service line remittance
    remittance_lines = []
    if service_lines:
        for i, line in enumerate(service_lines):
            line_billed = line.get("charge_amount", line.get("amount", 0)) or 0
            line_rate = payer["contracted_rate_pct"] if payer else 0.80
            line_allowed = round(line_billed * line_rate, 2)
            line_paid = round(line_allowed * 0.80, 2) if decision == "approved" else 0.0
            line_adj = round(line_billed - line_allowed, 2)

            remittance_lines.append({
                "service_date": datetime.utcnow().date().isoformat(),
                "cpt_code": line.get("cpt_code", line.get("code", "99213")),
                "cpt_description": line.get("description", "Office Visit"),
                "units": line.get("units", 1),
                "billed_amount": line_billed,
                "allowed_amount": line_allowed,
                "paid_amount": line_paid,
                "adjustment_amount": line_adj,
                "patient_responsibility": round(line_allowed - line_paid, 2),
                "carc_code": carc_code,
                "carc_description": CARC_DESCRIPTIONS.get(carc_code, ""),
            })

    # If no service lines provided, build a summary line
    if not remittance_lines:
        remittance_lines = [{
            "service_date": datetime.utcnow().date().isoformat(),
            "cpt_code": "99213",
            "cpt_description": "Office/Outpatient Visit — Summary",
            "units": 1,
            "billed_amount": billed_amount,
            "allowed_amount": round(billed_amount * (payer["contracted_rate_pct"] if payer else 0.80), 2),
            "paid_amount": paid_amount,
            "adjustment_amount": contractual_adj,
            "patient_responsibility": patient_responsibility,
            "carc_code": carc_code,
            "carc_description": CARC_DESCRIPTIONS.get(carc_code, ""),
        }]

    return {
        "era_id": era_id,
        "era_type": "835",
        "generated_at": datetime.utcnow().isoformat(),

        # Payer Info
        "payer_name": payer_name,
        "payer_id": payer_id,
        "payer_address": payer.get("address", "N/A") if payer else "N/A",

        # Check / EFT Info
        "check_number": check_num,
        "check_date": datetime.utcnow().date().isoformat(),
        "payment_method": "EFT",
        "payment_status": "PAID" if decision == "approved" else "DENIED",

        # Claim Summary
        "claim_number": claim_number,
        "internal_control_number": icn,
        "claim_status": decision.upper(),
        "billed_amount": billed_amount,
        "allowed_amount": round(billed_amount * (payer["contracted_rate_pct"] if payer else 0.80), 2),
        "contractual_adjustment": contractual_adj,
        "carc_code": carc_code,
        "carc_description": CARC_DESCRIPTIONS.get(carc_code, ""),
        "paid_amount": paid_amount,
        "patient_responsibility": patient_responsibility,

        # Service Line Detail
        "service_lines": remittance_lines,

        # Totals
        "total_billed": billed_amount,
        "total_allowed": round(sum(l["allowed_amount"] for l in remittance_lines), 2),
        "total_paid": paid_amount,
        "total_patient_responsibility": patient_responsibility,
        "total_adjustment": contractual_adj,
    }
