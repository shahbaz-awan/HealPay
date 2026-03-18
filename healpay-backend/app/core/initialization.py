import logging
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.db import models
from app.services import index_loader
from app.db.seeds import seed_users, seed_medical_codes

logger = logging.getLogger(__name__)

def initialize_system():
    """
    Centrally managed system bootstrap.
    Ensures DB tables, System Actors, and AI Indexes are ready.
    """
    logger.info("🚀 Starting HealPay System Initialization...")
    
    # 1. Database Table Creation (Atomic)
    try:
        logger.info("Step 1/3: Verifying Database Tables...")
        models.Base.metadata.create_all(bind=engine)
        logger.info("✓ Database tables verified.")
    except Exception as e:
        logger.error("❌ Critical: Database creation failed: %s", e)
        # We don't raise here to allow the app to attempt to start, 
        # but most functionality will fail.
    
    # 2. System Actor & Data Seeding
    db: Session = SessionLocal()
    try:
        logger.info("Step 2/3: Seeding System Actors & Medical Codes...")
        
        # Seed default users (Admin, Doctor, Coder, Biller)
        # This ensures login works immediately after deployment
        seed_users(db)
        
        # Seed medical code library
        seed_medical_codes(db)
        
        db.commit()
        logger.info("✓ System data seeding complete.")
    except Exception as e:
        db.rollback()
        logger.error("⚠️ Seeding failed (might already exist): %s", e)
    finally:
        db.close()
    
    # 3. AI Index Warm-up (Background Ready)
    try:
        logger.info("Step 3/3: Warming up AI Recommendation Engine...")
        # We call warm_up. If it fails due to memory, it sets _dense_available = False
        # but keeps the system functional in BM25 mode.
        index_loader.warm_up()
        logger.info("✓ AI Engine initialization triggered.")
    except Exception as e:
        logger.warning("⚠️ AI initialization encountered an issue: %s", e)

    logger.info("✅ HealPay System Initialization Complete.")
