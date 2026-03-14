"""
Mock Payer Database
Simulates 12 real-world insurance payers with realistic properties:
- Processing times, denial rates, contracted rate multipliers
- Common denial reason codes (CARC) per payer
- Payer IDs matching real-world identifiers
"""

from typing import Dict, List, Optional, Any

PAYERS: Dict[str, Dict] = {
    "BCBS": {
        "name": "Blue Cross Blue Shield",
        "payer_id": "00710",
        "avg_processing_days": 14,
        "denial_rate": 0.12,          # 12% of claims denied
        "contracted_rate_pct": 0.82,  # Pays 82% of billed charges
        "common_carc_codes": ["CO-4", "CO-11", "CO-18", "PR-1"],
        "address": "225 N. Michigan Ave, Chicago, IL 60601",
        "phone": "1-800-810-BLUE",
        "claim_filing_limit_days": 365,
        "requires_referral": False,
        "description": "Blue Cross Blue Shield (National)",
    },
    "AETNA": {
        "name": "Aetna",
        "payer_id": "60054",
        "avg_processing_days": 12,
        "denial_rate": 0.15,
        "contracted_rate_pct": 0.78,
        "common_carc_codes": ["CO-4", "CO-16", "CO-50", "PR-2"],
        "address": "151 Farmington Ave, Hartford, CT 06156",
        "phone": "1-888-632-3862",
        "claim_filing_limit_days": 180,
        "requires_referral": True,
        "description": "Aetna Health Insurance",
    },
    "UHC": {
        "name": "United Healthcare",
        "payer_id": "87726",
        "avg_processing_days": 15,
        "denial_rate": 0.18,          # Notoriously high denial rate
        "contracted_rate_pct": 0.75,
        "common_carc_codes": ["CO-4", "CO-11", "CO-15", "CO-97", "PR-96"],
        "address": "9900 Bren Road East, Minnetonka, MN 55343",
        "phone": "1-866-270-5988",
        "claim_filing_limit_days": 90,
        "requires_referral": True,
        "description": "United Healthcare (UHC/Optum)",
    },
    "CIGNA": {
        "name": "Cigna",
        "payer_id": "62308",
        "avg_processing_days": 10,
        "denial_rate": 0.14,
        "contracted_rate_pct": 0.80,
        "common_carc_codes": ["CO-4", "CO-29", "CO-49", "PR-1"],
        "address": "900 Cottage Grove Rd, Bloomfield, CT 06002",
        "phone": "1-800-244-6224",
        "claim_filing_limit_days": 180,
        "requires_referral": False,
        "description": "Cigna Healthcare",
    },
    "HUMANA": {
        "name": "Humana",
        "payer_id": "61101",
        "avg_processing_days": 18,
        "denial_rate": 0.16,
        "contracted_rate_pct": 0.77,
        "common_carc_codes": ["CO-4", "CO-11", "CO-22", "PR-2"],
        "address": "500 West Main Street, Louisville, KY 40202",
        "phone": "1-800-448-6262",
        "claim_filing_limit_days": 365,
        "requires_referral": True,
        "description": "Humana Health Plans",
    },
    "MEDICARE": {
        "name": "Medicare (CMS)",
        "payer_id": "00040",
        "avg_processing_days": 30,
        "denial_rate": 0.08,          # Lower denial rate — more standardized
        "contracted_rate_pct": 0.80,
        "common_carc_codes": ["CO-4", "CO-16", "CO-97", "CO-119", "MA130"],
        "address": "7500 Security Blvd, Baltimore, MD 21244",
        "phone": "1-800-MEDICARE",
        "claim_filing_limit_days": 365,
        "requires_referral": False,
        "description": "Medicare Federal Health Insurance (CMS)",
    },
    "MEDICAID": {
        "name": "Medicaid",
        "payer_id": "77013",
        "avg_processing_days": 45,
        "denial_rate": 0.20,
        "contracted_rate_pct": 0.65,  # Lowest payer rate
        "common_carc_codes": ["CO-4", "CO-15", "CO-31", "CO-18", "PR-96"],
        "address": "Centers for Medicare & Medicaid Services",
        "phone": "1-877-267-2323",
        "claim_filing_limit_days": 365,
        "requires_referral": False,
        "description": "State Medicaid Program",
    },
    "ANTHEM": {
        "name": "Anthem / Elevance Health",
        "payer_id": "00227",
        "avg_processing_days": 13,
        "denial_rate": 0.13,
        "contracted_rate_pct": 0.81,
        "common_carc_codes": ["CO-4", "CO-11", "CO-16", "PR-1"],
        "address": "220 Virginia Ave, Indianapolis, IN 46204",
        "phone": "1-800-676-BLUE",
        "claim_filing_limit_days": 365,
        "requires_referral": False,
        "description": "Anthem / Elevance Health (Blue Cross licensee)",
    },
    "OSCAR": {
        "name": "Oscar Health",
        "payer_id": "SX159",
        "avg_processing_days": 8,
        "denial_rate": 0.10,
        "contracted_rate_pct": 0.83,
        "common_carc_codes": ["CO-4", "CO-50", "PR-2"],
        "address": "75 Varick Street, New York, NY 10013",
        "phone": "1-855-OSCAR-55",
        "claim_filing_limit_days": 180,
        "requires_referral": False,
        "description": "Oscar Health (Tech-forward payer)",
    },
    "MOLINA": {
        "name": "Molina Healthcare",
        "payer_id": "MLNHC",
        "avg_processing_days": 35,
        "denial_rate": 0.19,
        "contracted_rate_pct": 0.70,
        "common_carc_codes": ["CO-4", "CO-11", "CO-15", "CO-18", "PR-96"],
        "address": "200 Oceangate, Suite 100, Long Beach, CA 90802",
        "phone": "1-888-562-5442",
        "claim_filing_limit_days": 365,
        "requires_referral": True,
        "description": "Molina Healthcare (Medicaid/Medicare focus)",
    },
    "TRICARE": {
        "name": "TRICARE / Defense Health Agency",
        "payer_id": "TRICR",
        "avg_processing_days": 20,
        "denial_rate": 0.09,
        "contracted_rate_pct": 0.85,
        "common_carc_codes": ["CO-4", "CO-16", "CO-109", "PR-1"],
        "address": "Defense Health Agency, Falls Church, VA 22042",
        "phone": "1-888-TRICARE",
        "claim_filing_limit_days": 365,
        "requires_referral": False,
        "description": "TRICARE Military Health System",
    },
    "KAISER": {
        "name": "Kaiser Permanente",
        "payer_id": "KAISE",
        "avg_processing_days": 7,
        "denial_rate": 0.07,          # Lowest denial rate — integrated system
        "contracted_rate_pct": 0.90,
        "common_carc_codes": ["CO-4", "CO-11", "PR-1"],
        "address": "One Kaiser Plaza, Oakland, CA 94612",
        "phone": "1-800-464-4000",
        "claim_filing_limit_days": 180,
        "requires_referral": True,
        "description": "Kaiser Permanente (Integrated HMO)",
    },
}

# CARC (Claim Adjustment Reason Code) human-readable descriptions
CARC_DESCRIPTIONS: Dict[str, str] = {
    "CO-4":   "The procedure code is inconsistent with the modifier used or a required modifier is missing.",
    "CO-11":  "The diagnosis is inconsistent with the procedure. Note: Refer to your Remittance Advice.",
    "CO-15":  "The authorization number is missing, invalid, or does not apply to the billed services.",
    "CO-16":  "Claim/service lacks information or has submission/billing errors.",
    "CO-18":  "Exact duplicate claim/service.",
    "CO-22":  "This care may be covered by another payer per coordination of benefits.",
    "CO-29":  "The time limit for filing has expired.",
    "CO-31":  "Patient cannot be identified as our insured.",
    "CO-45":  "Charge exceeds fee schedule/maximum allowable or contracted/legislated fee arrangement.",
    "CO-49":  "These are non-covered services because this is a routine exam or screening procedure done in conjunction with a routine exam.",
    "CO-50":  "These are non-covered services because this is not deemed a 'medical necessity' by the payer.",
    "CO-97":  "The benefit for this service is included in the payment/allowance for another service/procedure.",
    "CO-109": "Claim/service not covered by this payer/contractor.",
    "CO-119": "Benefit maximum for this time period or occurrence has been reached.",
    "MA130":  "Your claim contains incomplete and/or invalid information.",
    "PR-1":   "Deductible amount.",
    "PR-2":   "Coinsurance amount.",
    "PR-96":  "Non-covered charges. Patient responsibility.",
}


def get_payer(payer_name: str) -> Optional[Dict]:
    """Find a payer by name (case-insensitive partial match)."""
    name_upper = payer_name.upper()
    # Exact key match first
    for key, payer in PAYERS.items():
        if key == name_upper or payer["name"].upper() == name_upper:
            return {"key": key, **payer}
    # Partial match
    for key, payer in PAYERS.items():
        if name_upper in payer["name"].upper() or key in name_upper:
            return {"key": key, **payer}
    return None


def get_all_payer_names() -> List[str]:
    """Return list of all payer names for dropdown menus."""
    return [p["name"] for p in PAYERS.values()]


def get_carc_description(carc_code: str) -> str:
    """Get human-readable description for a CARC denial code."""
    return CARC_DESCRIPTIONS.get(carc_code, f"Denial reason code: {carc_code}")
