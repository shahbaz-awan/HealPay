from slowapi import Limiter
from slowapi.util import get_remote_address

# Module-level limiter instance shared across the application.
# Endpoints import this and decorate with @limiter.limit("N/period").
limiter = Limiter(key_func=get_remote_address)
