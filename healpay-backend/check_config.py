from app.core.config import settings
from app.core.email import EmailService

print("="*60)
print("Configuration Check")
print("="*60)
print(f"SMTP_HOST: {settings.SMTP_HOST}")
print(f"SMTP_PORT: {settings.SMTP_PORT}")
print(f"SMTP_USER: {settings.SMTP_USER}")
print(f"SMTP_PASSWORD: {'*' * len(settings.SMTP_PASSWORD) if settings.SMTP_PASSWORD else '(empty)'}")
print(f"SMTP_FROM_EMAIL: {settings.SMTP_FROM_EMAIL}")
print(f"SMTP_FROM_NAME: {settings.SMTP_FROM_NAME}")
print(f"\nEmail configured: {EmailService.is_email_configured()}")
print("="*60)


