from fastapi import APIRouter

from app.api.v1.endpoints import auth, admin, patient_intake, clinical, appointments, billing_routes, notifications, mock_routes

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router,           prefix="/auth",          tags=["Authentication"])
api_router.include_router(admin.router,          prefix="/admin",         tags=["Admin"])
api_router.include_router(patient_intake.router, prefix="/patient-intake", tags=["Patient Intake"])
api_router.include_router(clinical.router,       prefix="/clinical",      tags=["Clinical Encounters"])
api_router.include_router(appointments.router,   prefix="/appointments",  tags=["Appointments"])
api_router.include_router(billing_routes.router, prefix="/billing",       tags=["Billing"])
api_router.include_router(notifications.router,  prefix="/notifications", tags=["Notifications"])
api_router.include_router(mock_routes.router,    prefix="/mock",          tags=["Mock Integrations"])

