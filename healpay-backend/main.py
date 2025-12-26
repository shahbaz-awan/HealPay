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

# Include API router
app.include_router(api_router, prefix="/api")

# DEBUG: Print all registered routes
print("\n" + "="*60)
print("REGISTERED ROUTES:")
for route in app.routes:
    if hasattr(route, 'path'):
        print(f"  {route.path}")
print("="*60 + "\n")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

