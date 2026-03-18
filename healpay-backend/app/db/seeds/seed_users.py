from app.db.database import SessionLocal, engine
from app.db.models import User, UserRole
from app.core.security import get_password_hash
import logging

logger = logging.getLogger(__name__)

USERS_TO_SEED = [
    {"email": "admin@healpay.com",   "role": UserRole.ADMIN,   "first_name": "System", "last_name": "Admin"},
    {"email": "doctor@healpay.com",  "role": UserRole.DOCTOR,  "first_name": "John",   "last_name": "Doe"},
    {"email": "coder@healpay.com",   "role": UserRole.CODER,   "first_name": "Alice",  "last_name": "Coder"},
    {"email": "billing@healpay.com", "role": UserRole.BILLING, "first_name": "Bob",    "last_name": "Biller"},
    {"email": "patient@healpay.com", "role": UserRole.PATIENT, "first_name": "Jane",   "last_name": "Patient"},
]

def seed_users(db=None):
    if db is None:
        db = SessionLocal()
        own_session = True
    else:
        own_session = False

    try:
        password_hash = get_password_hash("password")
        seeded_count = 0
        
        for user_data in USERS_TO_SEED:
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            if not existing_user:
                new_user = User(
                    email=user_data["email"],
                    hashed_password=password_hash,
                    role=user_data["role"],
                    first_name=user_data["first_name"],
                    last_name=user_data["last_name"],
                    is_active=True,
                    is_verified=True
                )
                db.add(new_user)
                seeded_count += 1
                logger.info(f"Created system actor: {user_data['email']}")
            else:
                # Force reset password and role to ensure they match our test credentials
                existing_user.hashed_password = password_hash
                existing_user.role = user_data["role"]
                existing_user.is_verified = True
                existing_user.is_active = True
                logger.info(f"Verified/Reset system actor: {user_data['email']}")
                seeded_count += 1
        
        db.commit()
        logger.info(f"Successfully processed {seeded_count} system actors.")
            
    except Exception as e:
        logger.error(f"Error seeding users: {e}")
        db.rollback()
    finally:
        if own_session:
            db.close()

if __name__ == "__main__":
    seed_users()
