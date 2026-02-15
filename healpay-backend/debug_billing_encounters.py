from app.db.database import SessionLocal
from app.db.models import ClinicalEncounter, User

db = SessionLocal()

print("-" * 50)
print("DEBUG: Checking Clinical Encounters Status")
print("-" * 50)

encounters = db.query(ClinicalEncounter).all()

if not encounters:
    print("No encounters found in the database.")
else:
    print(f"Found {len(encounters)} encounters:")
    for enc in encounters:
        patient = db.query(User).filter(User.id == enc.patient_id).first()
        doctor = db.query(User).filter(User.id == enc.doctor_id).first()
        patient_name = f"{patient.first_name} {patient.last_name}" if patient else "Unknown"
        doctor_name = f"{doctor.first_name} {doctor.last_name}" if doctor else "Unknown"
        
        print(f"ID: {enc.id} | Date: {enc.encounter_date} | Status: '{enc.status}' | Patient: {patient_name} | Doctor: {doctor_name}")

print("-" * 50)
print("Checking for 'ready' encounters (coded or sent_to_biller)...")
ready = db.query(ClinicalEncounter).filter(ClinicalEncounter.status.in_(['coded', 'sent_to_biller'])).all()
print(f"Query found {len(ready)} ready encounters.")
print("-" * 50)
