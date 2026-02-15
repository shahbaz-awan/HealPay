"""Update Ali Khan user to have CODER role"""
from app.db.database import SessionLocal
from app.db.models import User, UserRole

db = SessionLocal()

# Find Ali Khan orany user that's not doctor/patient
ali = db.query(User).filter(User.first_name.like('%Ali%')).first()

if ali:
    print(f"Found user: {ali.first_name} {ali.last_name} ({ali.email})")
    print(f"Current role: {ali.role}")
    ali.role = UserRole.CODER
    db.commit()
    print(f"✅ Updated to role: {ali.role}")
else:
    print("Ali Khan user not found")
    # Show all users
    users = db.query(User).all()
    print("\nAll users:")
    for u in users:
        print(f"  ID:{u.id} | {u.first_name} {u.last_name} | {u.email} | Role:{u.role}")

db.close()
