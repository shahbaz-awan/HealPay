import os
from dotenv import load_dotenv

load_dotenv()

print("="*60)
print("Database Configuration Check")
print("="*60)
db_url = os.getenv("DATABASE_URL", "NOT SET")
print(f"DATABASE_URL from .env: {db_url}")
print("="*60)

# Try to extract details
if db_url and db_url.startswith("postgresql://"):
    parts = db_url.replace("postgresql://", "").split("@")
    if len(parts) == 2:
        user_pass = parts[0].split(":")
        host_db = parts[1].split("/")
        print(f"User: {user_pass[0]}")
        print(f"Password: {'*' * len(user_pass[1]) if len(user_pass) > 1 else 'NOT SET'}")
        print(f"Host: {host_db[0].split(':')[0]}")
        print(f"Port: {host_db[0].split(':')[1] if ':' in host_db[0] else '5432'}")
        print(f"Database: {host_db[1] if len(host_db) > 1 else 'NOT SET'}")
print("="*60)
