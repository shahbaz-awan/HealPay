# HealPay - Healthcare Payment Platform

A secure full-stack healthcare payment management system with OTP-based authentication, user administration, and role-based access control.

## 🚀 Tech Stack

**Backend:**
- FastAPI (Python)
- PostgreSQL / SQLite
- SQLAlchemy ORM
- JWT Authentication
- OTP Email Verification

**Frontend:**
- React 18 with TypeScript
- Vite
- TailwindCSS
- React Router
- Zustand (State Management)
- Axios

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **Node.js 16+** and npm - [Download](https://nodejs.org/)
- **PostgreSQL** (optional, SQLite works too) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/downloads/)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/shahbaz-awan/HealPay.git
cd HealPay
```

### 2. Backend Setup

#### Step 1: Navigate to backend directory
```bash
cd healpay-backend
```

#### Step 2: Create a virtual environment
**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Step 3: Install dependencies
```bash
pip install -r requirements.txt
```

#### Step 4: Configure Environment Variables
Create a `.env` file in the `healpay-backend` directory:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database (SQLite - easiest for development)
DATABASE_URL=sqlite:///./healpay.db

# Security
SECRET_KEY=your-secret-key-here-change-this-to-something-secure

# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# OTP Configuration
OTP_LENGTH=4
OTP_EXPIRY_MINUTES=3
```

> **Note for Gmail:** You need to generate an [App Password](https://support.google.com/accounts/answer/185833) instead of using your regular password.

#### Step 5: Initialize the Database
```bash
python create_fresh_db.py
```

#### Step 6: Start the Backend Server
```bash
# Windows
start_backend.bat

# macOS/Linux
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at: **http://localhost:8000**

API Documentation: **http://localhost:8000/docs**

---

### 3. Frontend Setup

Open a **new terminal** and navigate to the frontend directory:

```bash
cd healpay-frontend
```

#### Step 1: Install dependencies
```bash
npm install
```

#### Step 2: Start the Development Server
```bash
npm run dev
```

The frontend will be available at: **http://localhost:5173**

---

## 🎯 Running the Application

1. **Start Backend** (Terminal 1):
   ```bash
   cd healpay-backend
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # macOS/Linux
   uvicorn main:app --reload
   ```

2. **Start Frontend** (Terminal 2):
   ```bash
   cd healpay-frontend
   npm run dev
   ```

3. **Access the Application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

---



---

## 🔧 Troubleshooting

### Backend Issues

**Database errors:**
```bash
# Reset the database
cd healpay-backend
python create_fresh_db.py
```

**Port already in use:**
```bash
# Use a different port
uvicorn main:app --reload --port 8001
```

### Frontend Issues

**Module not found errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Port already in use:**
```bash
# Vite will automatically suggest a different port
# Or specify: npm run dev -- --port 5174
```

### Email/OTP Issues

- Verify your SMTP credentials in `.env`
- For Gmail, ensure you're using an App Password
- Check spam/junk folder for OTP emails

---

## 📁 Project Structure

```
HealPay/
├── healpay-backend/          # FastAPI backend
│   ├── app/
│   │   ├── api/              # API endpoints
│   │   ├── core/             # Core functionality (auth, config)
│   │   ├── db/               # Database models
│   │   ├── schemas/          # Pydantic schemas
│   │   └── services/         # Business logic
│   ├── .env                  # Environment variables
│   ├── main.py               # Application entry point
│   └── requirements.txt      # Python dependencies
│
├── healpay-frontend/         # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API service layer
│   │   ├── store/            # Zustand state management
│   │   └── routes/           # Route configuration
│   └── package.json          # Node dependencies
│
└── SRS/                      # Software Requirements Specification
```

---

## 🔐 Features

- ✅ OTP-based Email Authentication
- ✅ Role-based Access Control (Admin, Doctor, Patient)
- ✅ User Management Dashboard
- ✅ Password Reset via Email
- ✅ Patient Intake Forms
- ✅ Appointment Scheduling
- ✅ Responsive UI with Dark Mode
- ✅ Real-time Form Validation

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is part of a Final Year Project (FYP).

---

## 📧 Contact

For questions or support, please contact the development team.

---

## 🐛 Known Issues

- Ensure both frontend and backend are running simultaneously
- `.env` file must be properly configured before starting the backend
- Email service requires valid SMTP credentials

---

**Happy Coding! 🚀**
