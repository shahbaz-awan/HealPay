from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.database import engine
from app.db import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Medical Billing System API",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    servers=[
        {"url": "http://localhost:8000", "description": "Local development server"}
    ]
)

# Configure CORS - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=False,  # Set to False when using allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router with v1 prefix
app.include_router(api_router, prefix="/api/v1")

# DEBUG: Print all registered routes
with open("routes.log", "w") as f:
    f.write("REGISTERED ROUTES:\n")
    for route in app.routes:
        if hasattr(route, 'path'):
            f.write(f"{route.path}\n")
            print(f"  {route.path}")

@app.get("/")
async def root():
    return {
        "message": "Welcome to HealPay Medical Billing System API",
        "version": settings.APP_VERSION,
        "docs": "/api/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }

# EMERGENCY ROUTE FOR BILLING
from fastapi import Depends
from app.core.security import get_current_user
from app.db.database import get_db
from sqlalchemy.orm import Session
from app.db.models import ClinicalEncounter, User

@app.get("/api/v1/billing/encounters/ready")
def get_ready_to_bill_encounters_direct(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print("DIRECT ENDPOINT HIT")
    encounters = db.query(ClinicalEncounter).filter(
        ClinicalEncounter.status.in_(['coded', 'sent_to_biller'])
    ).all()
    results = []
    for enc in encounters:
        patient = db.query(User).filter(User.id == enc.patient_id).first()
        doctor = db.query(User).filter(User.id == enc.doctor_id).first()
        results.append({
            "id": enc.id,
            "encounter_date": enc.encounter_date,
            "patient_name": f"{patient.first_name} {patient.last_name}" if patient else "Unknown",
            "doctor_name": f"{doctor.first_name} {doctor.last_name}" if doctor else "Unknown",
            "type": enc.encounter_type,
            "status": enc.status
        })
    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )

