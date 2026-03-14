"""
Mock Insurance Eligibility Service
Simulates real-time insurance eligibility verification (270/271 EDI).
Uses deterministic logic — same inputs always return the same result.
"""
import hashlib
from typing import Dict, Any
from app.services.mock.payer_database import get_payer, get_all_payer_names


# Common deductible/out-of-pocket values per plan type
_PLAN_TIERS = {
    0: {"plan_type": "HMO Gold",     "deductible": 500,   "oop_max": 2500,  "copay": 20,  "coinsurance": 0.10, "coverage_pct": 0.90},
    1: {"plan_type": "PPO Silver",   "deductible": 1500,  "oop_max": 5000,  "copay": 40,  "coinsurance": 0.20, "coverage_pct": 0.80},
    2: {"plan_type": "HDHP Bronze",  "deductible": 3000,  "oop_max": 7000,  "copay": 60,  "coinsurance": 0.30, "coverage_pct": 0.70},
    3: {"plan_type": "Medicare A/B", "deductible": 1600,  "oop_max": 8700,  "copay": 0,   "coinsurance": 0.20, "coverage_pct": 0.80},
    4: {"plan_type": "Medicaid",     "deductible": 0,     "oop_max": 0,     "copay": 3,   "coinsurance": 0.00, "coverage_pct": 1.00},
}


def _deterministic_hash(text: str, mod: int) -> int:
    """Produces stable deterministic integer from any string."""
    h = int(hashlib.md5(text.encode()).hexdigest(), 16)
    return h % mod


def verify_eligibility(
    patient_name: str,
    date_of_birth: str,
    insurance_provider: str,
    policy_number: str,
    group_number: str = "",
    date_of_service: str = "",
) -> Dict[str, Any]:
    """
    Simulates a 271 Eligibility Response.

    Returns coverage details deterministically based on patient/policy info.
    ~10% of policies return as inactive (realistic rejection scenario).
    """
    # Combine inputs for a stable hash
    seed = f"{policy_number}|{insurance_provider}|{date_of_birth}"
    coverage_hash = _deterministic_hash(seed, 100)

    # 10% of policies are "inactive" — realistic scenario
    is_active = coverage_hash >= 10

    payer = get_payer(insurance_provider)
    payer_name = payer["name"] if payer else insurance_provider
    payer_id = payer["payer_id"] if payer else "UNKNWN"

    if not is_active:
        return {
            "status": "inactive",
            "eligible": False,
            "payer_name": payer_name,
            "payer_id": payer_id,
            "policy_number": policy_number,
            "message": "Coverage terminated or policy not found. Please verify patient information.",
            "transaction_id": f"271-{_deterministic_hash(seed, 999999):06d}",
            "response_code": "271-AA-INACTIVE",
        }

    # Deterministically assign a plan tier (0–4) based on policy number
    tier_idx = _deterministic_hash(policy_number, 5)
    plan = _PLAN_TIERS[tier_idx]

    # Simulate deductible already-met (varies per patient)
    deductible_met = round(plan["deductible"] * (_deterministic_hash(seed + "deductible", 100) / 100), 2)
    oop_met = round(plan["oop_max"] * (_deterministic_hash(seed + "oop", 100) / 150), 2)

    # Prior auth required for certain CPTs based on payer
    requires_prior_auth = payer["requires_referral"] if payer else False

    # Group number — generate if not provided
    effective_group = group_number if group_number else f"GRP{_deterministic_hash(seed, 99999):05d}"

    # Plan effective/termination dates (always valid for demo)
    from datetime import date, timedelta
    today = date.today()
    effective_date = (today - timedelta(days=180)).isoformat()
    termination_date = (today + timedelta(days=185)).isoformat()

    return {
        "status": "active",
        "eligible": True,
        "transaction_id": f"271-{_deterministic_hash(seed, 999999):06d}",
        "response_code": "271-AA",
        "payer_name": payer_name,
        "payer_id": payer_id,
        "patient_name": patient_name,
        "policy_number": policy_number,
        "group_number": effective_group,
        "plan_type": plan["plan_type"],
        "plan_name": f"{payer_name} {plan['plan_type']}",
        "effective_date": effective_date,
        "termination_date": termination_date,
        "coverage": {
            "coverage_percentage": int(plan["coverage_pct"] * 100),
            "deductible_total": plan["deductible"],
            "deductible_met": deductible_met,
            "deductible_remaining": max(0, round(plan["deductible"] - deductible_met, 2)),
            "out_of_pocket_max": plan["oop_max"],
            "out_of_pocket_met": oop_met,
            "out_of_pocket_remaining": max(0, round(plan["oop_max"] - oop_met, 2)),
            "copay_office_visit": plan["copay"],
            "coinsurance_pct": int(plan["coinsurance"] * 100),
            "requires_referral": requires_prior_auth,
            "requires_prior_auth_for": ["MRI", "CT Scan", "Surgery", "Specialist"] if requires_prior_auth else [],
        },
        "network": {
            "in_network": True,
            "network_name": f"{payer_name} Preferred Network",
        },
        "message": "Patient is eligible for coverage on date of service.",
    }


def get_available_payers() -> list:
    """Return all available payer names for the frontend dropdown."""
    return get_all_payer_names()
