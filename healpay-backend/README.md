# 🏥 HealPay Backend - Medical Billing System API

AI-Powered Medical Billing System Backend built with FastAPI and PostgreSQL.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- PostgreSQL 14+
- pip or conda

### 1. Create Virtual Environment

```bash
cd D:\FYP\healpay-backend
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```cmd
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Setup PostgreSQL Database

**Option A: Using pgAdmin**
1. Open pgAdmin
2. Create new database named `healpay_db`
3. Note your username and password

**Option B: Using psql command line**
```sql
CREATE DATABASE healpay_db;
```

### 5. Configure Environment

Create `.env` file:
```bash
copy .env.example .env
```

Edit `.env` with your database credentials:
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/healpay_db
SECRET_KEY=your-super-secret-key-change-this
```

### 6. Run the Server

```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 📚 API Documentation

Once server is running, visit:

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **Health Check**: http://localhost:8000/health

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "strongpassword123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "PATIENT"
}
```

**Roles:**
- `PATIENT`
- `DOCTOR`
- `CODER`
- `BILLING`
- `ADMIN`

### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "strongpassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "PATIENT",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00"
  },
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

## 🗂️ Project Structure

```
healpay-backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   └── auth.py        # Auth endpoints
│   │   │   └── router.py          # Main router
│   │   └── dependencies.py        # Auth dependencies
│   ├── core/
│   │   ├── config.py              # Settings
│   │   └── security.py            # JWT & Password
│   ├── db/
│   │   ├── database.py            # DB connection
│   │   └── models.py              # SQLAlchemy models
│   └── schemas/
│       └── user.py                # Pydantic schemas
├── main.py                        # FastAPI application
├── requirements.txt               # Dependencies
├── .env.example                   # Environment template
└── README.md                      # This file
```

---

## 🔧 Database Models

### User Model
- `id`: Integer (Primary Key)
- `email`: String (Unique)
- `hashed_password`: String
- `first_name`: String
- `last_name`: String
- `role`: Enum (PATIENT, DOCTOR, CODER, BILLING, ADMIN)
- `is_active`: Boolean
- `is_verified`: Boolean
- `avatar`: String (Optional)
- `created_at`: DateTime
- `updated_at`: DateTime

---

## 🔒 Security Features

- ✅ **Password Hashing** (bcrypt)
- ✅ **JWT Tokens** (Access & Refresh)
- ✅ **Role-Based Access Control**
- ✅ **CORS Configuration**
- ✅ **Encrypted Database Connection**
- ✅ **Environment Variables**

---

## 🧪 Testing the API

### Using cURL

**Register:**
```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User",
    "role": "PATIENT"
  }'
```

**Login:**
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## 🐛 Troubleshooting

### Database Connection Error
```
sqlalchemy.exc.OperationalError: could not connect to server
```
**Solution:**
1. Make sure PostgreSQL is running
2. Check credentials in `.env`
3. Verify database exists

### Import Errors
```
ModuleNotFoundError: No module named 'fastapi'
```
**Solution:**
```bash
pip install -r requirements.txt
```

### Port Already in Use
```
Error: [Errno 10048] address already in use
```
**Solution:**
```bash
# Use different port
uvicorn main:app --port 8001
```

---

## 📝 Next Steps

- [ ] Add more endpoints (patients, doctors, etc.)
- [ ] Implement AI features (code recommendations)
- [ ] Add email verification
- [ ] Implement password reset
- [ ] Add file upload for documents
- [ ] Create admin dashboard endpoints

---

## 🤝 Integration with Frontend

Update frontend `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

The backend is now ready to accept requests from your React frontend!

---

## 📧 Support

For issues or questions, please check the API documentation at `/api/docs`

---

**Made with ❤️ for Healthcare Providers**

