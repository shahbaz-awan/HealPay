"""
OTP Service - Handles OTP generation, storage, and verification
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.models import OTP, OTPType, UserRole
from app.core.otp_generator import generate_otp
from app.core.email import EmailService
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class OTPService:
    """Service for managing OTP operations"""
    
    @staticmethod
    def create_registration_otp(
        db: Session,
        email: str,
        hashed_password: str,
        first_name: str,
        last_name: str,
        role: UserRole
    ) -> str:
        """
        Create OTP for email verification during registration
        Stores registration data temporarily
        Returns the OTP code
        """
        try:
            # Delete any existing unused OTPs for this email
            db.query(OTP).filter(
                OTP.email == email,
                OTP.otp_type == OTPType.EMAIL_VERIFICATION,
                OTP.is_used == False
            ).delete()
            db.commit()
            
            # Generate OTP
            otp_code = generate_otp()
            expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
            
            # Create OTP record with registration data
            new_otp = OTP(
                email=email,
                otp_code=otp_code,
                otp_type=OTPType.EMAIL_VERIFICATION,
                expires_at=expires_at,
                is_used=False,
                # Store registration data temporarily
                hashed_password=hashed_password,
                first_name=first_name,
                last_name=last_name,
                role=role
            )
            
            db.add(new_otp)
            db.commit()
            db.refresh(new_otp)
            
            logger.info(f"✅ Created OTP for {email}: {otp_code}")
            
            return otp_code
            
        except Exception as e:
            logger.error(f"❌ Error creating OTP: {str(e)}")
            db.rollback()
            raise
    
    @staticmethod
    async def send_otp_email(email: str, otp_code: str, user_name: str) -> bool:
        """Send OTP via email"""
        try:
            if EmailService.is_email_configured():
                logger.info(f"📧 Attempting to send OTP email to {email}")
                result = await EmailService.send_otp_email(
                    to_email=email,
                    otp_code=otp_code,
                    user_name=user_name,
                    purpose="verification"
                )
                logger.info(f"📧 Email send result: {result}")
                return result
            else:
                # Development mode - just log
                logger.warning("=" * 60)
                logger.warning("📧 EMAIL NOT CONFIGURED - OTP CODE:")
                logger.warning(f"Email: {email}")
                logger.warning(f"OTP: {otp_code}")
                logger.warning("=" * 60)
                return True
                
        except Exception as e:
            import traceback
            logger.error(f"❌ Error sending OTP email: {str(e)}")
            logger.error(f"❌ Error type: {type(e).__name__}")
            logger.error(f"❌ Traceback:")
            logger.error(traceback.format_exc())
            return False
    
    @staticmethod
    def verify_otp(db: Session, email: str, otp_code: str) -> OTP:
        """
        Verify OTP code
        Returns OTP record if valid, None otherwise
        """
        try:
            # Find OTP
            otp = db.query(OTP).filter(
                OTP.email == email,
                OTP.otp_code == otp_code,
                OTP.otp_type == OTPType.EMAIL_VERIFICATION,
                OTP.is_used == False
            ).first()
            
            if not otp:
                logger.warning(f"❌ OTP not found for {email}")
                return None
            
            # Check expiration
            if datetime.utcnow() > otp.expires_at:
                logger.warning(f"❌ OTP expired for {email}")
                return None
            
            # Mark as used
            otp.is_used = True
            db.commit()
            
            logger.info(f"✅ OTP verified for {email}")
            return otp
            
        except Exception as e:
            logger.error(f"❌ Error verifying OTP: {str(e)}")
            db.rollback()
            return None
