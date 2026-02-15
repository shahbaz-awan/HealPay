"""Test if pending encounters API is working"""
from app.db.database import SessionLocal
from app.db.models import ClinicalEncounter, User, UserRole

db = SessionLocal()

print("=" * 60)
print("DATABASE STATUS CHECK")
print("=" * 60)

# Check users
users = db.query(User).all()
print(f"\n👥 Total Users: {len(users)}")
for u in users:
    print(f"   {u.id}: {u.email} ({u.role})")

# Check encounters
encounters = db.query(ClinicalEncounter).all()
print(f"\n🏥 Total Encounters: {len(encounters)}")
for e in encounters:
    print(f"   ID:{e.id} | Patient:{e.patient_id} | Doctor:{e.doctor_id} | Status:{e.status}")
    print(f"       Chief Complaint: {e.chief_complaint}")

# Check pending encounters specifically
pending = db.query(ClinicalEncounter).filter(
    ClinicalEncounter.status == "pending_coding"
).all()
print(f"\n⏳ Pending Coding: {len(pending)}")
for e in pending:
    patient = db.query(User).filter(User.id == e.patient_id).first()
    doctor = db.query(User).filter(User.id == e.doctor_id).first()
    print(f"   ID:{e.id}")
    print(f"   Patient: {patient.first_name} {patient.last_name} (ID:{patient.id})")
    print(f"   Doctor: {doctor.first_name} {doctor.last_name} (ID:{doctor.id})")
    print(f"   Chief Complaint: {e.chief_complaint}")
    print()

db.close()

print("=" * 60)
if len(pending) == 0:
    print("❌ NO PENDING ENCOUNTERS FOUND!")
    print("The seed script may not have created encounters properly.")
else:
    print(f"✅ {len(pending)} PENDING ENCOUNTERS EXIST IN DATABASE")
    print("If the frontend shows 0, there may be an API or auth issue.")
print("=" * 60)
