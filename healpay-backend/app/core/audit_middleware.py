"""
HIPAA Audit Middleware
Logs every request to sensitive PHI (Protected Health Information) endpoints
into the audit_logs table per HIPAA §164.312 requirements.

Sensitive prefixes tracked:
  /api/v1/patient-intake
  /api/v1/clinical
  /api/v1/billing
  /api/v1/admin
"""
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import AuditLog
from app.core.security import decode_token

logger = logging.getLogger(__name__)

# Prefixes that contain PHI — anything else is not audited
_AUDITED_PREFIXES = (
    "/api/v1/patient-intake",
    "/api/v1/clinical",
    "/api/v1/billing",
    "/api/v1/admin",
    "/api/v1/appointments",
    "/api/v1/notifications",
)

_METHOD_TO_ACTION = {
    "GET": "READ",
    "POST": "CREATE",
    "PUT": "UPDATE",
    "PATCH": "UPDATE",
    "DELETE": "DELETE",
}


def _extract_resource(path: str):
    """Return (resource_type, resource_id) from a URL path."""
    parts = [p for p in path.split("/") if p]
    # e.g. ["api","v1","clinical","encounters","42","codes"]
    if "v1" in parts:
        idx = parts.index("v1")
        segments = parts[idx + 1:]  # ["clinical","encounters","42","codes"]
    else:
        segments = parts

    resource_type = "/".join(segments[:2]) if len(segments) >= 2 else "/".join(segments)
    resource_id = None
    for seg in segments:
        if seg.isdigit():
            resource_id = int(seg)
            break
    return resource_type, resource_id


class HIPAAAuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path

        # Only audit PHI-sensitive endpoints
        if not any(path.startswith(p) for p in _AUDITED_PREFIXES):
            return await call_next(request)

        # Resolve caller identity from JWT (best-effort — don't block on failure)
        user_id = None
        user_email = None
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            try:
                payload = decode_token(token)
                user_email = payload.get("sub")
            except Exception:
                pass

        response: Response = await call_next(request)

        action = _METHOD_TO_ACTION.get(request.method, request.method)
        resource_type, resource_id = _extract_resource(path)
        ip = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent", "")[:255]

        try:
            db: Session = SessionLocal()
            # Resolve user_id from email if we got it
            if user_email and not user_id:
                from app.db.models import User
                u = db.query(User).filter(User.email == user_email).first()
                if u:
                    user_id = u.id
            entry = AuditLog(
                user_id=user_id,
                user_email=user_email,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                ip_address=ip,
                user_agent=user_agent,
                status_code=response.status_code,
            )
            db.add(entry)
            db.commit()
        except Exception as exc:
            logger.warning("Audit log write failed: %s", exc)
        finally:
            try:
                db.close()
            except Exception:
                pass

        return response
