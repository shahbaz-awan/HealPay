"""
Claim Risk Analyzer — HealPay
Validates CMS-1500 form data before submission and returns a risk assessment
with actionable feedback on fields that could cause claim rejection.
"""
from typing import List, Dict, Any, Optional
import re


# ─── Severity Levels ────────────────────────────────────────────────────────

HIGH   = "HIGH"
MEDIUM = "MEDIUM"
LOW    = "LOW"


# ─── Known valid ICD-10 / CPT format patterns ───────────────────────────────

ICD10_PATTERN = re.compile(r'^[A-Z]\d{2}(\.\w{1,4})?$', re.IGNORECASE)
CPT_PATTERN   = re.compile(r'^\d{4,5}[A-Z]?$', re.IGNORECASE)
NPI_PATTERN   = re.compile(r'^\d{10}$')


# ─── Core analyzer ──────────────────────────────────────────────────────────

def analyze_claim_risk(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyzes a CMS-1500 claim payload and returns:
      - risk_level   : HIGH | MEDIUM | LOW
      - risk_score   : 0–100 (higher = riskier)
      - issues       : list of { severity, field, box, message, suggestion }
      - summary      : human-readable conclusion
      - passed_checks: list of fields that are correctly filled
    """
    issues: List[Dict] = []
    passed: List[str]  = []

    # ── Box 1  Insurance type ───────────────────────────────────────────────
    insurance_type = (payload.get("insuranceType") or "").strip()
    if not insurance_type:
        issues.append(_issue(HIGH, "insuranceType", "Box 1",
            "Insurance type not selected.",
            "Select Medicare, Medicaid, or appropriate payer type in Box 1."))
    else:
        passed.append("Box 1 – Insurance type selected")

    # ── Box 1a Insured ID ───────────────────────────────────────────────────
    insured_id = (payload.get("insuredId") or "").strip()
    if not insured_id:
        issues.append(_issue(HIGH, "insuredId", "Box 1a",
            "Insured member ID is missing.",
            "Enter the patient's insurance member ID (from insurance card) in Box 1a."))
    else:
        passed.append("Box 1a – Insured member ID present")

    # ── Box 2  Patient name ─────────────────────────────────────────────────
    last  = (payload.get("patientLastName")  or "").strip()
    first = (payload.get("patientFirstName") or "").strip()
    if not last or not first:
        issues.append(_issue(HIGH, "patientName", "Box 2",
            f"Patient name incomplete (last='{last}', first='{first}').",
            "Provide patient's full legal last and first name in Box 2."))
    else:
        passed.append("Box 2 – Patient name filled")

    # ── Box 3  Patient DOB ──────────────────────────────────────────────────
    dob = (payload.get("patientDOB") or "").strip()
    if not dob:
        issues.append(_issue(HIGH, "patientDOB", "Box 3",
            "Patient date of birth is missing.",
            "Enter patient's date of birth (MM/DD/YYYY) in Box 3."))
    else:
        passed.append("Box 3 – Patient DOB present")

    # ── Box 5  Patient address ──────────────────────────────────────────────
    addr = (payload.get("patientStreet") or "").strip()
    city = (payload.get("patientCity")   or "").strip()
    state= (payload.get("patientState")  or "").strip()
    if not addr or not city or not state:
        issues.append(_issue(MEDIUM, "patientAddress", "Box 5",
            "Patient address is incomplete.",
            "Fill in street, city, and state in Box 5."))
    else:
        passed.append("Box 5 – Patient address filled")

    # ── Box 11  Insured policy/group no ────────────────────────────────────
    policy = (payload.get("insuredPolicy") or "").strip()
    if not policy:
        issues.append(_issue(MEDIUM, "insuredPolicy", "Box 11",
            "Insured's policy or group number is missing.",
            "Add the group/policy number from the insurance card in Box 11."))
    else:
        passed.append("Box 11 – Policy/group number present")

    # ── Box 14  Date of current illness ────────────────────────────────────
    doi = (payload.get("dateOfIllness") or "").strip()
    if not doi:
        issues.append(_issue(MEDIUM, "dateOfIllness", "Box 14",
            "Date of current illness / injury is missing.",
            "Enter the onset date of the condition in Box 14."))
    else:
        passed.append("Box 14 – Date of illness present")

    # ── Box 21  Diagnosis codes ─────────────────────────────────────────────
    diag_labels = ["diagnosisA","diagnosisB","diagnosisC","diagnosisD",
                   "diagnosisE","diagnosisF","diagnosisG","diagnosisH",
                   "diagnosisI","diagnosisJ","diagnosisK","diagnosisL"]
    diagnosis_codes = [
        (payload.get(lbl) or "").strip().upper()
        for lbl in diag_labels
        if (payload.get(lbl) or "").strip()
    ]

    if not diagnosis_codes:
        issues.append(_issue(HIGH, "diagnosisCodes", "Box 21",
            "No ICD-10 diagnosis codes provided.",
            "Add at least one ICD-10 code in Box 21 (A–L)."))
    else:
        passed.append(f"Box 21 – {len(diagnosis_codes)} diagnosis code(s) present")
        # Validate format
        bad_icd = [c for c in diagnosis_codes if not ICD10_PATTERN.match(c)]
        if bad_icd:
            issues.append(_issue(HIGH, "diagnosisCodes", "Box 21",
                f"Invalid ICD-10 code format: {', '.join(bad_icd)}.",
                "ICD-10 codes must follow format like E11.40, I21.3, Z87.39."))
        # Duplicate check
        if len(diagnosis_codes) != len(set(diagnosis_codes)):
            issues.append(_issue(LOW, "diagnosisCodes", "Box 21",
                "Duplicate diagnosis codes detected.",
                "Remove duplicate ICD-10 codes from Box 21."))

    # Build set of used pointer letters (A=0, B=1 …)
    valid_pointer_letters = set(
        chr(ord('A') + i) for i in range(len(diagnosis_codes))
    )

    # ── Box 24  Service lines ───────────────────────────────────────────────
    service_lines = payload.get("serviceLines", []) or []
    filled_lines  = [
        sl for sl in service_lines
        if (sl.get("cpt") or "").strip()
    ]

    if not filled_lines:
        issues.append(_issue(HIGH, "serviceLines", "Box 24",
            "No CPT procedure codes found in service lines.",
            "Add at least one CPT code with date, charges, and units in Box 24."))
    else:
        passed.append(f"Box 24 – {len(filled_lines)} service line(s) filled")
        for idx, sl in enumerate(filled_lines):
            row = idx + 1
            cpt    = (sl.get("cpt")       or "").strip().upper()
            date_f = (sl.get("dateFrom")  or "").strip()
            charge = (sl.get("charges")   or "").strip()
            units  = (sl.get("units")     or "").strip()
            ptr    = (sl.get("diagPointer") or "").strip().upper()
            npi    = (sl.get("renderingNPI") or "").strip()

            # CPT format
            if cpt and not CPT_PATTERN.match(cpt):
                issues.append(_issue(HIGH, f"serviceLines[{idx}].cpt", f"Box 24 row {row}",
                    f"CPT code '{cpt}' has an invalid format.",
                    "CPT codes are 5-digit numeric (or 4-digit + letter for Category III)."))

            # Date
            if not date_f:
                issues.append(_issue(HIGH, f"serviceLines[{idx}].dateFrom", f"Box 24 row {row}",
                    f"Service line {row} is missing a service date.",
                    "Enter the date of service in the 'From' column of Box 24A."))

            # Charges
            if not charge:
                issues.append(_issue(MEDIUM, f"serviceLines[{idx}].charges", f"Box 24 row {row}",
                    f"Service line {row} has no charge amount.",
                    "Enter the fee amount in Box 24F for this procedure."))
            else:
                try:
                    if float(charge) <= 0:
                        issues.append(_issue(MEDIUM, f"serviceLines[{idx}].charges", f"Box 24 row {row}",
                            f"Charge for service line {row} is zero or negative.",
                            "Verify the correct fee amount in Box 24F."))
                except ValueError:
                    issues.append(_issue(MEDIUM, f"serviceLines[{idx}].charges", f"Box 24 row {row}",
                        f"Charge '{charge}' is not a valid number.",
                        "Enter a numeric dollar amount in Box 24F."))

            # Units
            if not units:
                issues.append(_issue(LOW, f"serviceLines[{idx}].units", f"Box 24 row {row}",
                    f"Service line {row} is missing unit count.",
                    "Enter '1' or the number of units in Box 24G."))

            # Diagnosis pointer
            if ptr and valid_pointer_letters and ptr not in valid_pointer_letters:
                issues.append(_issue(HIGH, f"serviceLines[{idx}].diagPointer", f"Box 24 row {row}",
                    f"Diagnosis pointer '{ptr}' on row {row} refers to a non-existent diagnosis code.",
                    f"Use pointers A–{chr(ord('A') + len(diagnosis_codes) - 1)} "
                    f"matching your Box 21 codes."))

            # Per-line: validate format if provided
            if npi and not NPI_PATTERN.match(npi):
                issues.append(_issue(MEDIUM, f"serviceLines[{idx}].renderingNPI", f"Box 24 row {row}",
                    f"Rendering provider NPI '{npi}' is not 10 digits.",
                    "NPI must be exactly 10 numeric digits."))

    # Aggregate NPI check: flag if ALL filled service lines are missing a Rendering NPI
    if filled_lines:
        all_missing_npi = all(
            not (sl.get("renderingNPI") or "").strip()
            for sl in filled_lines
        )
        if all_missing_npi:
            issues.append(_issue(LOW, "renderingNPI", "Box 24J",
                "No Rendering Provider NPI found on any service line.",
                "Enter the rendering provider's 10-digit NPI in Box 24J for at least one service line."))

    # ── Box 25  Federal tax ID ──────────────────────────────────────────────
    tax_id = (payload.get("federalTaxId") or "").strip()
    if not tax_id:
        issues.append(_issue(MEDIUM, "federalTaxId", "Box 25",
            "Federal Tax ID (EIN/SSN) is missing.",
            "Enter the billing provider's EIN or SSN in Box 25."))
    else:
        passed.append("Box 25 – Federal Tax ID present")

    # ── Box 28 Total charge ─────────────────────────────────────────────────
    total = (payload.get("totalCharge") or "").strip()
    if not total:
        issues.append(_issue(MEDIUM, "totalCharge", "Box 28",
            "Total charge amount is missing.",
            "Enter the sum of all service line charges in Box 28."))
    else:
        # Cross-check against service lines
        try:
            line_sum = sum(
                float(sl.get("charges") or 0)
                for sl in filled_lines
                if (sl.get("charges") or "").strip()
            )
            total_val = float(total)
            if line_sum > 0 and abs(total_val - line_sum) > 0.01:
                issues.append(_issue(MEDIUM, "totalCharge", "Box 28",
                    f"Total charge (${total_val:.2f}) does not match "
                    f"sum of service line charges (${line_sum:.2f}).",
                    "Ensure Box 28 equals the sum of all Box 24F charges."))
            else:
                passed.append("Box 28 – Total charge matches service lines")
        except ValueError:
            pass

    # ── Box 33  Billing provider NPI ───────────────────────────────────────
    billing_npi = (payload.get("billingProviderNPI") or "").strip()
    if not billing_npi:
        issues.append(_issue(HIGH, "billingProviderNPI", "Box 33",
            "Billing provider NPI is missing.",
            "Enter the billing provider's 10-digit NPI in Box 33b."))
    elif not NPI_PATTERN.match(billing_npi):
        issues.append(_issue(HIGH, "billingProviderNPI", "Box 33",
            f"Billing provider NPI '{billing_npi}' is not 10 digits.",
            "NPI must be exactly 10 numeric digits (no hyphens)."))
    else:
        passed.append("Box 33 – Billing provider NPI valid")

    # ── Box 33  Billing provider name ──────────────────────────────────────
    billing_name = (payload.get("billingProviderName") or "").strip()
    if not billing_name:
        issues.append(_issue(MEDIUM, "billingProviderName", "Box 33",
            "Billing provider name is missing.",
            "Enter the practice or provider name in Box 33."))
    else:
        passed.append("Box 33 – Billing provider name present")

    # ── Calculate risk score and level ─────────────────────────────────────
    high_count   = sum(1 for i in issues if i["severity"] == HIGH)
    medium_count = sum(1 for i in issues if i["severity"] == MEDIUM)
    low_count    = sum(1 for i in issues if i["severity"] == LOW)

    risk_score = min(100, (high_count * 25) + (medium_count * 10) + (low_count * 3))

    if high_count >= 1:
        risk_level = HIGH
    elif medium_count >= 2 or risk_score >= 25:
        risk_level = MEDIUM
    else:
        risk_level = LOW

    # ── Summary sentence ────────────────────────────────────────────────────
    total_issues = len(issues)
    if total_issues == 0:
        summary = "All required fields are correctly filled. Claim is ready for submission."
    elif risk_level == HIGH:
        summary = (
            f"{high_count} critical issue(s) detected — claim will likely be rejected. "
            f"Resolve all HIGH severity issues before submitting."
        )
    elif risk_level == MEDIUM:
        summary = (
            f"{total_issues} issue(s) found ({high_count} high, {medium_count} medium). "
            f"Claim may be delayed or partially rejected."
        )
    else:
        summary = (
            f"{total_issues} minor issue(s) found. "
            f"Claim can likely be submitted but review flagged fields."
        )

    return {
        "risk_level":    risk_level,
        "risk_score":    risk_score,
        "total_issues":  total_issues,
        "high_count":    high_count,
        "medium_count":  medium_count,
        "low_count":     low_count,
        "issues":        issues,
        "passed_checks": passed,
        "summary":       summary,
    }


# ─── Helper ─────────────────────────────────────────────────────────────────

def _issue(severity: str, field: str, box: str, message: str, suggestion: str) -> Dict:
    return {
        "severity":   severity,
        "field":      field,
        "box":        box,
        "message":    message,
        "suggestion": suggestion,
    }
