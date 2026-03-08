import logging
from sqlalchemy import func, join
from sqlalchemy.orm import Session, joinedload
from app.db.models import Invoice, Payment, ClinicalEncounter, Claim, Appointment, User
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class BillingService:
    def get_dashboard_stats(self, db: Session):
        """Calculate billing dashboard statistics"""
        
        # 1. Total Revenue (Sum of all payments)
        total_revenue = db.query(Payment).with_entities(func.sum(Payment.amount)).scalar() or 0.0
        
        # 2. Outstanding Balance (Sum of invoice balance_due)
        outstanding = db.query(Invoice).filter(Invoice.status != 'paid', Invoice.status != 'cancelled').with_entities(func.sum(Invoice.balance_due)).scalar() or 0.0
        
        # 3. Collected This Month
        today = datetime.now()
        first_day_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        collected_month = db.query(Payment).filter(Payment.payment_date >= first_day_of_month).with_entities(func.sum(Payment.amount)).scalar() or 0.0
        
        # 4. Overdue Amount
        overdue = db.query(Invoice).filter(Invoice.status == 'overdue').with_entities(func.sum(Invoice.balance_due)).scalar() or 0.0

        # Counts for badges/subtitles
        pending_invoices_count = db.query(Invoice).filter(Invoice.status == 'issued').count()
        overdue_invoices_count = db.query(Invoice).filter(Invoice.status == 'overdue').count()

        return {
            "total_revenue": total_revenue,
            "outstanding": outstanding,
            "collected_month": collected_month,
            "overdue": overdue,
            "pending_invoices_count": pending_invoices_count,
            "overdue_invoices_count": overdue_invoices_count
        }

    def get_recent_invoices(self, db: Session, limit: int = 10):
        """Get list of recent invoices with patient details using a join (no N+1)"""
        rows = (
            db.query(Invoice, User)
            .join(User, User.id == Invoice.patient_id)
            .order_by(Invoice.created_at.desc())
            .limit(limit)
            .all()
        )
        results = []
        for inv, patient in rows:
            results.append({
                "id": inv.id,
                "invoice_number": inv.invoice_number,
                "patient_name": f"{patient.first_name} {patient.last_name}",
                "total_amount": inv.total_amount,
                "amount_paid": inv.amount_paid,
                "balance_due": inv.balance_due,
                "status": inv.status,
                "issue_date": inv.issue_date,
                "due_date": inv.due_date,
            })
        return results

    def get_recent_payments(self, db: Session, limit: int = 10):
        """Get list of recent payments with patient details"""
        payments = db.query(Payment).order_by(Payment.payment_date.desc()).limit(limit).all()
        return payments

    def create_invoice(self, db: Session, data: dict):
        """Create a new invoice"""
        # Generate Invoice Number (Simple logic: INV-YYYYMMDD-ID)
        today_str = datetime.now().strftime("%Y%m%d")
        
        # Create object — invoice_number gets a stable value after first flush gives us the PK
        db_invoice = Invoice(
            patient_id=data['patient_id'],
            encounter_id=data.get('encounter_id'),
            claim_id=data.get('claim_id'),
            invoice_number=f"INV-{today_str}-TEMP",  # Temporary placeholder
            issue_date=datetime.now().strftime("%Y-%m-%d"),
            due_date=(datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),  # 30-day terms
            total_amount=data['amount'],
            balance_due=data['amount'],
            status='issued'
        )
        
        db.add(db_invoice)
        db.flush()  # Gets the auto-incremented id without committing

        # Now set collision-free invoice number using DB-assigned id
        db_invoice.invoice_number = f"INV-{today_str}-{db_invoice.id:05d}"
        db.commit()
        db.refresh(db_invoice)
        
        return db_invoice

    def record_payment(self, db: Session, data: dict):
        """Record a payment for an invoice"""
        invoice = db.query(Invoice).filter(Invoice.id == data['invoice_id']).first()
        if not invoice:
            raise Exception("Invoice not found")
            
        payment = Payment(
            invoice_id=invoice.id,
            amount=data['amount'],
            payment_method=data['payment_method'],
            transaction_id=data.get('transaction_id'),
            notes=data.get('notes')
        )
        
        db.add(payment)
        
        # Update invoice status
        invoice.amount_paid += data['amount']
        invoice.balance_due = invoice.total_amount - invoice.amount_paid
        
        if invoice.balance_due <= 0:
            invoice.status = 'paid'
            invoice.balance_due = 0 # Prevent negative balance due
            
        db.commit()
        db.refresh(payment)
        return payment
