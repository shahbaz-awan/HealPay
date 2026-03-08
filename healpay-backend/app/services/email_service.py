import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# Email configuration from environment variables
SMTP_HOST = settings.SMTP_HOST
SMTP_PORT = settings.SMTP_PORT
SMTP_USER = settings.SMTP_USER
SMTP_PASSWORD = settings.SMTP_PASSWORD


def send_otp_email(to_email: str, otp: str, purpose: str = "signup") -> bool:
    """
    Send OTP via email.
    
    Args:
        to_email: Recipient email address
        otp: 4-digit OTP code
        purpose: 'signup' or 'password_reset'
    
    Returns:
        True if email sent successfully, False otherwise
    """
    try:
        # Email content based on purpose
        if purpose == "signup":
            subject = "Welcome to HealPay - Verify Your Email"
            heading = "Email Verification"
            message_text = "Thank you for registering with HealPay! Please use the following code to verify your email address:"
        else:  # password_reset
            subject = "HealPay - Password Reset Code"
            heading = "Password Reset"
            message_text = "You have requested to reset your password. Please use the following code to proceed:"

        # HTML email template
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .container {{
                    background: linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #dbeafe 100%);
                    border-radius: 10px;
                    padding: 40px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }}
                .logo {{
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .logo h1 {{
                    color: #2563eb;
                    font-size: 32px;
                    margin: 0;
                }}
                .logo p {{
                    color: #64748b;
                    font-size: 14px;
                    margin: 5px 0 0 0;
                }}
                .content {{
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    margin: 20px 0;
                }}
                h2 {{
                    color: #2563eb;
                    margin-top: 0;
                }}
                .otp-box {{
                    background: #f8fafc;
                    border: 2px solid #2563eb;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    margin: 25px 0;
                }}
                .otp-code {{
                    font-size: 36px;
                    font-weight: bold;
                    color: #2563eb;
                    letter-spacing: 8px;
                    margin: 10px 0;
                }}
                .expiry {{
                    color: #ef4444;
                    font-size: 14px;
                    margin-top: 15px;
                }}
                .footer {{
                    text-align: center;
                    color: #64748b;
                    font-size: 12px;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                }}
                .warning {{
                    background: #fef3c7;
                    border-left: 4px solid #f59e0b;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                    font-size: 14px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">
                    <h1>🏥 HealPay</h1>
                    <p>AI-Powered Medical Billing</p>
                </div>
                
                <div class="content">
                    <h2>{heading}</h2>
                    <p>{message_text}</p>
                    
                    <div class="otp-box">
                        <p style="margin: 0; font-size: 14px; color: #64748b;">Your OTP Code</p>
                        <div class="otp-code">{otp}</div>
                        <p class="expiry">⏱️ This code will expire in 3 minutes</p>
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Security Notice:</strong><br>
                        Never share this code with anyone. HealPay support will never ask for your OTP.
                    </div>
                    
                    <p style="margin-top: 25px;">
                        If you didn't request this code, please ignore this email or contact our support team.
                    </p>
                </div>
                
                <div class="footer">
                    <p><strong>HealPay Medical Billing System</strong></p>
                    <p>This is an automated message, please do not reply to this email.</p>
                    <p style="margin-top: 15px;">
                        Need help? Contact us at <a href="mailto:support@healpay.com" style="color: #2563eb;">support@healpay.com</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"HealPay <{SMTP_USER}>"
        msg['To'] = to_email

        # Attach HTML content
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)

        # Send email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

        logger.info("OTP email sent successfully to %s", to_email)
        return True

    except Exception as e:
        logger.error("Failed to send OTP email to %s: %s", to_email, e, exc_info=True)
        # In development/no-SMTP mode, log the OTP to the console
        if not SMTP_USER:
            logger.warning("[DEV MODE] OTP for %s is: %s (purpose: %s)", to_email, otp, purpose)
            return True
        return False


def send_welcome_email(to_email: str, first_name: str) -> bool:
    """
    Send welcome email after successful signup.
    
    Args:
        to_email: User's email
        first_name: User's first name
    
    Returns:
        True if sent successfully
    """
    try:
        subject = "Welcome to HealPay!"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2563eb;">Welcome to HealPay, {first_name}!</h2>
            <p>Your account has been successfully verified.</p>
            <p>You can now access all features of our medical billing platform.</p>
            <p>Get started by logging in to your dashboard.</p>
            <br>
            <p>Best regards,<br>The HealPay Team</p>
        </body>
        </html>
        """
        
        msg = MIMEMultipart()
        msg['Subject'] = subject
        msg['From'] = f"HealPay <{SMTP_USER}>"
        msg['To'] = to_email
        msg.attach(MIMEText(html_content, 'html'))
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

        return True
    except Exception as e:
        logger.error("Failed to send welcome email to %s: %s", to_email, e, exc_info=True)
        return False
