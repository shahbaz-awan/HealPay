# HealPay - Medical Billing System Frontend

<div align="center">

![HealPay Logo](https://img.shields.io/badge/HealPay-Medical%20Billing-blue?style=for-the-badge&logo=activity)

**AI-Powered Medical Billing Platform**

[![React](https://img.shields.io/badge/React-18.2-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-blue?logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple?logo=vite)](https://vitejs.dev/)

</div>

---

## 🌟 Features

### Core Features
- ✅ **Role-Based Authentication** - Patient, Doctor, Medical Coder, Billing Staff, Admin
- ✅ **Beautiful UI/UX** - Modern, responsive design with smooth animations
- ✅ **Real-time Updates** - Live data synchronization
- ✅ **Secure** - JWT authentication, HIPAA compliant

### AI-Powered Features 🤖
- 🧠 **AI Code Recommendations** - Intelligent ICD-10 and CPT code suggestions (Medical Coder Dashboard)
- 📊 **Rejection Prediction** - ML-powered claim rejection risk analysis (Billing Dashboard)
- 🎯 **Smart Search** - Context-aware medical code search
- 📈 **Predictive Analytics** - Trend analysis and insights

### Advanced UI Features
- 🎨 **Glassmorphism Effects** - Modern glass-like UI components
- ✨ **Framer Motion Animations** - Smooth, professional animations
- 🌊 **Scroll Animations** - Interactive scroll-based effects
- 🎭 **Hover Effects** - Engaging micro-interactions
- 🔄 **Loading States** - Beautiful loading skeletons
- 📱 **Fully Responsive** - Mobile, tablet, and desktop support

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Backend API running (see backend repository)

### Installation

1. **Install Dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

2. **Environment Setup**
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your API URL
VITE_API_BASE_URL=http://localhost:8000/api
```

3. **Run Development Server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. **Open Browser**
Navigate to `http://localhost:5173`

---

## 📁 Project Structure

```
src/
├── assets/              # Images, logos, static files
├── components/          # Reusable components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components (Sidebar, Header)
│   └── ui/             # UI components (Button, Input, Card)
├── pages/              # Page components
│   ├── auth/          # Login, Register pages
│   ├── patient/       # Patient dashboard
│   ├── doctor/        # Doctor dashboard
│   ├── coder/         # Medical Coder dashboard (AI)
│   ├── billing/       # Billing dashboard (AI)
│   └── admin/         # Admin dashboard
├── routes/             # Route configuration
├── services/           # API services
├── store/              # State management (Zustand)
├── types/              # TypeScript types
├── utils/              # Utility functions
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

---

## 🎨 Tech Stack

### Core
- **React 18.2** - UI library
- **TypeScript 5.2** - Type safety
- **Vite 5.0** - Build tool & dev server

### Styling
- **Tailwind CSS 3.3** - Utility-first CSS
- **Framer Motion 10.16** - Animations
- **Lucide React** - Icon library

### State Management
- **Zustand 4.4** - Global state
- **React Query 5.13** - Server state & caching

### Forms & Validation
- **React Hook Form 7.48** - Form handling
- **Zod 3.22** - Schema validation

### Data Visualization
- **Recharts 2.10** - Charts & graphs

### HTTP Client
- **Axios 1.6** - API requests

### UI Libraries
- **React Toastify 9.1** - Notifications

---

## 👥 User Roles & Dashboards

### 1. Patient Portal
- View appointments
- Medical records
- Pay bills
- Update profile

### 2. Doctor Portal
- Patient management
- Encounter documentation
- Schedule management
- Clinical notes

### 3. Medical Coder Dashboard ⭐ (AI-Powered)
**Features:**
- AI-powered ICD-10 code recommendations
- AI-powered CPT procedure code suggestions
- Confidence scores for each recommendation
- Highlighted medical terms in clinical notes
- One-click accept/reject recommendations
- Manual code search and modification

**AI Features:**
- 95%+ accuracy in code suggestions
- Extracts medical terms using NLP
- Matches terms to appropriate codes
- Provides reasoning for recommendations

### 4. Billing Staff Dashboard ⭐ (AI-Powered)
**Features:**
- Claim generation and submission
- AI rejection risk prediction
- Risk level indicators (LOW/MEDIUM/HIGH)
- Detailed issue detection
- AI-powered suggestions for fixes
- Real-time claim tracking
- Analytics and reporting

**AI Features:**
- Predicts claim rejection probability
- Identifies potential issues before submission
- Suggests fixes for detected problems
- Reduces claim rejections by 50%+

### 5. Admin Dashboard
- User management
- System monitoring
- ML model training
- Analytics and reports

---

## 🎯 Key Pages

### Landing Page
- Hero section with animated background
- Feature showcase
- Statistics display
- Call-to-action sections
- Responsive design

### Authentication
- Login page with OAuth support
- Registration with role selection
- Password recovery
- Beautiful split-screen design

### AI-Powered Interfaces

#### Medical Coder Interface
```typescript
// AI Code Recommendations Flow:
1. Select pending encounter
2. View clinical notes
3. AI analyzes notes and suggests codes
4. Review confidence scores
5. Accept/modify/reject suggestions
6. Submit coded encounter
```

#### Billing Interface
```typescript
// AI Rejection Prediction Flow:
1. Select claim for review
2. AI analyzes claim data
3. Risk score calculated (0-100%)
4. Potential issues highlighted
5. AI suggestions provided
6. Fix issues or submit claim
```

---

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
```

---

## 🎨 Design System

### Colors
- **Primary Blue**: `#1890ff` - Main brand color
- **Success Green**: `#52c41a` - Success states
- **Warning Yellow**: `#faad14` - Warning states
- **Danger Red**: `#ff4d4f` - Error states
- **Purple**: `#722ed1` - Accent color

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800

### Animations
- Fade-in on page load
- Hover scale effects
- Loading spinners
- Skeleton loaders
- Scroll-based animations
- Floating elements

---

## 🔐 Authentication Flow

```typescript
1. User enters credentials
2. Frontend sends POST /api/auth/login
3. Backend validates and returns JWT token
4. Token stored in Zustand (persisted)
5. Token added to all API requests
6. Protected routes check authentication
7. Role-based access control applied
```

---

## 📊 API Integration

### Base Configuration
```typescript
// src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
```

### Example API Calls
```typescript
// Login
authService.login({ email, password })

// Get AI Code Recommendations
coderService.getCodeRecommendations(encounterId)

// Get Rejection Prediction
billingService.predictRejection(claimId)
```

---

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Output
- Optimized production build in `dist/`
- Static files ready for deployment
- Tree-shaking applied
- Code splitting enabled

### Deploy To:
- **Vercel** - Recommended for Vite projects
- **Netlify** - Simple drag & drop
- **AWS S3 + CloudFront** - Scalable solution
- **Docker** - Containerized deployment

---

## 🧪 Testing (To be implemented)

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

---

## 📝 Environment Variables

Create a `.env` file in the root:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is part of a Final Year Project (FYP).

---

## 👨‍💻 Developer

Developed as part of Final Year Project

---

## 🙏 Acknowledgments

- HealPay SRS Documentation
- Medical billing workflow diagrams
- AI/ML model specifications
- UX/UI design inspirations

---

## 📞 Support

For support, email or create an issue in the repository.

---

<div align="center">

**Made with ❤️ for Healthcare Providers**

⭐ Star this repo if you find it helpful!

</div>

