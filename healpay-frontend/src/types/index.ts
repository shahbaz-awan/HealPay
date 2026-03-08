// User Types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  avatar?: string
  createdAt: string
  updatedAt: string
  // Backend snake_case equivalents (mapped after login)
  first_name?: string
  last_name?: string
  created_at?: string
  updated_at?: string
  // Profile fields
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  zip_code?: string
  // Specialization (doctors only)
  specialization?: string
  // Status
  isActive?: boolean
  is_active?: boolean
  isVerified?: boolean
  is_verified?: boolean
}

export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  CODER = 'CODER',
  BILLING = 'BILLING',
  ADMIN = 'ADMIN',
}

// Auth Types
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role?: UserRole
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}

// Patient Types
export interface Patient {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  email: string
  phone: string
  address: Address
  insurance: InsuranceInfo
  medicalHistory: MedicalHistory[]
  createdAt: string
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface InsuranceInfo {
  provider: string
  policyNumber: string
  groupNumber: string
  coverageStartDate: string
  coverageEndDate?: string
}

export interface MedicalHistory {
  condition: string
  diagnosedDate: string
  status: 'active' | 'resolved'
  notes?: string
}

// Encounter Types
export interface Encounter {
  id: string
  patientId: string
  doctorId: string
  encounterDate: string
  chiefComplaint: string
  clinicalNotes: string
  diagnosis: string[]
  procedures: string[]
  vitalSigns: VitalSigns
  status: EncounterStatus
  createdAt: string
  updatedAt: string
}

export interface VitalSigns {
  bloodPressure: string
  heartRate: number
  temperature: number
  respiratoryRate: number
  oxygenSaturation: number
}

export enum EncounterStatus {
  DRAFT = 'DRAFT',
  PENDING_CODING = 'PENDING_CODING',
  CODED = 'CODED',
  PENDING_BILLING = 'PENDING_BILLING',
  BILLED = 'BILLED',
}

// Medical Code Types
export interface MedicalCode {
  id: string
  code: string
  description: string
  type: CodeType
}

export enum CodeType {
  ICD10 = 'ICD10',
  CPT = 'CPT',
}

export interface CodeRecommendation {
  code: MedicalCode
  confidence: number
  matchedTerms: string[]
  reasoning: string
}

export interface CodeAssignment {
  encounterId: string
  codes: MedicalCode[]
  aiRecommendations?: CodeRecommendation[]
  codedBy: string
  codedAt: string
}

// Claim Types
export interface Claim {
  id: string
  claimNumber: string
  encounterId: string
  patientId: string
  providerId: string
  insuranceId: string
  codes: MedicalCode[]
  totalAmount: number
  status: ClaimStatus
  submittedAt?: string
  paidAt?: string
  rejectionReason?: string
  rejectionPrediction?: RejectionPrediction
  createdAt: string
  updatedAt: string
}

export enum ClaimStatus {
  DRAFT = 'DRAFT',
  PENDING_SUBMISSION = 'PENDING_SUBMISSION',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
}

export interface RejectionPrediction {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  probability: number
  potentialIssues: string[]
  suggestions: string[]
}

// Payment Types
export interface Payment {
  id: string
  claimId: string
  amount: number
  paymentMethod: PaymentMethod
  paymentDate: string
  status: PaymentStatus
  transactionId: string
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  INSURANCE = 'INSURANCE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// Dashboard Types
export interface DashboardStats {
  totalPatients: number
  pendingEncounters: number
  pendingClaims: number
  rejectionRate: number
  totalRevenue: number
  monthlyRevenue: number[]
}

