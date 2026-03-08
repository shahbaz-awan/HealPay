import logging
import json
import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from typing import List, Any, Dict
from datetime import date, timedelta
from app.db.database import get_db
from app.db.models import User, UserRole, ClinicalEncounter, Invoice, Payment, Claim, Appointment
from app.schemas.user import UserRegister, AuthResponse, UserResponse, UserUpdate
from app.core.security import get_password_hash, create_access_token, create_refresh_token, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency that enforces ADMIN role"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get all users - Admin endpoint
    Returns all user information except passwords
    """
    users = db.query(User).offset(skip).limit(limit).all()
    
    # Convert each user to UserResponse format
    user_responses = []
    for user in users:
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            address=None,
            city=None,
            state=None,
            zip_code=None,
            role=user.role,
            specialization=user.specialization,
            is_active=user.is_active,
            is_verified=user.is_verified,
            avatar=None,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
        user_responses.append(user_response)
    
    return user_responses

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get a specific user by ID
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update user information including password and email
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update fields if provided
    update_data = user_update.dict(exclude_unset=True)
    
    # Hash password if it's being updated
    if 'password' in update_data and update_data['password']:
        update_data['hashed_password'] = get_password_hash(update_data['password'])
        del update_data['password']  # Remove plain password
    
    # Update user fields
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Delete a user
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    logger.info("Admin %s deleted user %s", current_user.email, user.email)
    db.delete(user)
    db.commit()
    return {"message": f"User {user.email} deleted successfully"}

@router.post("/create-user", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserRegister,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Admin endpoint to create users with any role
    User can immediately login after creation
    """
    from app.db.models import UserRole as DBUserRole
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user with specified role
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        role=user_data.role,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create tokens for the user
    access_token = create_access_token(data={"sub": new_user.email, "role": new_user.role.value})
    refresh_token = create_refresh_token(data={"sub": new_user.email, "role": new_user.role.value})
    
    # Prepare response
    user_response = UserResponse(
        id=new_user.id,
        email=new_user.email,
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        phone=new_user.phone,
        address=None,
        city=None,
        state=None,
        zip_code=None,
        role=new_user.role,
        specialization=new_user.specialization,
        is_active=new_user.is_active,
        is_verified=new_user.is_verified,
        avatar=None,
        created_at=new_user.created_at,
        updated_at=new_user.updated_at
    )
    
    return {
        "user": user_response,
        "token": access_token,
        "refreshToken": refresh_token
    }


# ─── Admin Reports ───────────────────────────────────────────────────────────

@router.get("/reports/summary")
def get_admin_summary_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Returns a high-level operational summary for the admin dashboard.
    All values are computed live from the DB — no stale caches.
    """
    today = date.today()
    month_start = today.replace(day=1).isoformat()
    today_str = today.isoformat()

    # User counts by role
    role_counts = (
        db.query(User.role, sql_func.count(User.id))
        .group_by(User.role)
        .all()
    )
    users_by_role = {r.value: c for r, c in role_counts}

    # Encounter stats
    total_encounters = db.query(ClinicalEncounter).count()
    pending_coding = db.query(ClinicalEncounter).filter(
        ClinicalEncounter.status == "pending_coding"
    ).count()
    encounters_this_month = db.query(ClinicalEncounter).filter(
        sql_func.date(ClinicalEncounter.encounter_date) >= month_start
    ).count()

    # Billing stats
    total_invoiced = db.query(sql_func.coalesce(sql_func.sum(Invoice.total_amount), 0)).scalar()
    total_collected = db.query(sql_func.coalesce(sql_func.sum(Invoice.amount_paid), 0)).scalar()
    outstanding = db.query(sql_func.coalesce(sql_func.sum(Invoice.balance_due), 0)).filter(
        Invoice.status.in_(["issued", "overdue"])
    ).scalar()
    overdue_count = db.query(Invoice).filter(
        Invoice.status == "issued",
        Invoice.due_date < today_str,
    ).count()

    # Claim stats
    claims_submitted = db.query(Claim).filter(Claim.status == "submitted").count()
    claims_approved = db.query(Claim).filter(Claim.status == "approved").count()
    claims_denied = db.query(Claim).filter(Claim.status == "denied").count()

    # Appointment stats
    appointments_today = db.query(Appointment).filter(
        Appointment.appointment_date == today_str
    ).count()
    appointments_this_month = db.query(Appointment).filter(
        Appointment.appointment_date >= month_start
    ).count()

    # Revenue by month (last 6 months)
    monthly_revenue = []
    for i in range(5, -1, -1):
        m_start = (today.replace(day=1) - timedelta(days=30 * i)).replace(day=1)
        if i == 0:
            m_end = today
        else:
            m_end = (m_start.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
        paid = db.query(sql_func.coalesce(sql_func.sum(Payment.amount), 0)).filter(
            sql_func.date(Payment.payment_date) >= m_start.isoformat(),
            sql_func.date(Payment.payment_date) <= m_end.isoformat(),
        ).scalar()
        monthly_revenue.append({
            "month": m_start.strftime("%b %Y"),
            "revenue": float(paid),
        })

    collection_rate = round((total_collected / total_invoiced * 100), 1) if total_invoiced else 0.0

    return {
        "users": {
            "total": sum(users_by_role.values()),
            "by_role": users_by_role,
        },
        "encounters": {
            "total": total_encounters,
            "pending_coding": pending_coding,
            "this_month": encounters_this_month,
        },
        "billing": {
            "total_invoiced": round(float(total_invoiced), 2),
            "total_collected": round(float(total_collected), 2),
            "outstanding": round(float(outstanding), 2),
            "overdue_count": overdue_count,
            "collection_rate_pct": collection_rate,
        },
        "claims": {
            "submitted": claims_submitted,
            "approved": claims_approved,
            "denied": claims_denied,
        },
        "appointments": {
            "today": appointments_today,
            "this_month": appointments_this_month,
        },
        "monthly_revenue": monthly_revenue,
    }


@router.get("/reports/users")
def get_user_activity_report(
    skip: int = 0,
    limit: int = 50,
    role: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """List users with their encounter/appointment activity counts."""
    query = db.query(User)
    if role:
        try:
            query = query.filter(User.role == UserRole(role.upper()))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid role: {role}")

    users = query.offset(skip).limit(limit).all()
    results = []
    for u in users:
        encounter_count = db.query(ClinicalEncounter).filter(
            ClinicalEncounter.patient_id == u.id
        ).count()
        appointment_count = db.query(Appointment).filter(
            Appointment.user_id == u.id
        ).count()
        results.append({
            "id": u.id,
            "name": f"{u.first_name} {u.last_name}",
            "email": u.email,
            "role": u.role.value,
            "encounters": encounter_count,
            "appointments": appointment_count,
            "joined": u.created_at,
        })
    return results


# ---------------------------------------------------------------------------
# System Settings  (persisted to settings.json alongside the DB)
# ---------------------------------------------------------------------------

_SETTINGS_PATH = os.path.join(os.path.dirname(__file__), "../../../../settings.json")

_DEFAULT_SETTINGS: Dict[str, Any] = {
    "billing": {
        "default_payment_terms_days": 30,
        "late_fee_percent": 1.5,
        "currency": "USD",
        "tax_rate_percent": 0.0,
    },
    "claims": {
        "auto_submit": False,
        "default_insurance_provider": "",
        "claim_expiry_days": 365,
    },
    "notifications": {
        "send_invoice_emails": True,
        "send_payment_reminders": True,
        "reminder_days_before_due": 7,
    },
    "system": {
        "facility_name": "HealPay Medical Center",
        "facility_npi": "",
        "facility_address": "",
        "facility_phone": "",
        "timezone": "America/New_York",
    },
}


def _load_settings() -> Dict[str, Any]:
    """Load settings from JSON file; return defaults if file doesn't exist."""
    try:
        path = os.path.abspath(_SETTINGS_PATH)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                stored = json.load(f)
            # Deep-merge with defaults so new keys always present
            merged = dict(_DEFAULT_SETTINGS)
            for section, values in stored.items():
                if section in merged and isinstance(values, dict):
                    merged[section] = {**merged[section], **values}
                else:
                    merged[section] = values
            return merged
    except Exception as exc:
        logger.warning("Could not load settings.json: %s", exc)
    return dict(_DEFAULT_SETTINGS)


def _save_settings(data: Dict[str, Any]) -> None:
    """Persist settings to JSON file."""
    path = os.path.abspath(_SETTINGS_PATH)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)


@router.get("/settings")
def get_settings(current_user: User = Depends(require_admin)) -> Dict[str, Any]:
    """Return current system settings."""
    return _load_settings()


@router.put("/settings")
def update_settings(
    payload: Dict[str, Any],
    current_user: User = Depends(require_admin),
) -> Dict[str, Any]:
    """
    Merge-update system settings.
    Send only the sections/keys you want to change; others are preserved.
    """
    current = _load_settings()
    for section, values in payload.items():
        if isinstance(values, dict) and section in current and isinstance(current[section], dict):
            current[section] = {**current[section], **values}
        else:
            current[section] = values
    _save_settings(current)
    return current
