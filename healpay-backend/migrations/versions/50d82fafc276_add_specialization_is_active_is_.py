"""add_specialization_is_active_is_verified_to_users

Revision ID: 50d82fafc276
Revises:
Create Date: 2026-03-07 14:53:18.798024

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision: str = '50d82fafc276'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - safe version that handles already-existing DB objects."""
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    existing_tables = inspector.get_table_names()

    # otp_verifications
    if 'otp_verifications' not in existing_tables:
        op.create_table(
            'otp_verifications',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('email', sa.String(), nullable=False),
            sa.Column('otp_code', sa.String(), nullable=False),
            sa.Column('purpose', sa.String(), nullable=False),
            sa.Column('user_data', sa.Text(), nullable=True),
            sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('used', sa.Boolean(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True),
                      server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_otp_verifications_email'), 'otp_verifications', ['email'], unique=False)
        op.create_index(op.f('ix_otp_verifications_id'), 'otp_verifications', ['id'], unique=False)

    # notifications
    if 'notifications' not in existing_tables:
        op.create_table(
            'notifications',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(), nullable=False),
            sa.Column('message', sa.Text(), nullable=False),
            sa.Column('type', sa.String(), nullable=True),
            sa.Column('is_read', sa.Boolean(), nullable=True),
            sa.Column('link', sa.String(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True),
                      server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_notification_user_unread', 'notifications', ['user_id', 'is_read'], unique=False)
        op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)

    # indexes - skip if already present
    existing_indexes = set()
    for tbl in inspector.get_table_names():
        for idx in inspector.get_indexes(tbl):
            existing_indexes.add(idx['name'])

    for idx_name, table_name, cols in [
        ('ix_appointment_status', 'appointments', ['status']),
        ('ix_appointment_user_id', 'appointments', ['user_id']),
        ('ix_clinical_encounter_status', 'clinical_encounters', ['status']),
        ('ix_invoice_patient_id', 'invoices', ['patient_id']),
        ('ix_invoice_status', 'invoices', ['status']),
        ('ix_medical_code_encounter_id', 'medical_codes', ['encounter_id']),
    ]:
        if idx_name not in existing_indexes and table_name in existing_tables:
            op.create_index(idx_name, table_name, cols, unique=False)

    # users columns
    existing_user_cols = {col['name'] for col in inspector.get_columns('users')}

    if 'specialization' not in existing_user_cols:
        op.add_column('users', sa.Column('specialization', sa.String(), nullable=True))

    if 'is_active' not in existing_user_cols:
        op.add_column('users', sa.Column('is_active', sa.Boolean(), nullable=True,
                                         server_default=sa.text('1')))
        op.execute('UPDATE users SET is_active = 1 WHERE is_active IS NULL')

    if 'is_verified' not in existing_user_cols:
        op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=True,
                                         server_default=sa.text('0')))
        op.execute('UPDATE users SET is_verified = 0 WHERE is_verified IS NULL')


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    existing_user_cols = {col['name'] for col in inspector.get_columns('users')}

    for col in ('is_verified', 'is_active', 'specialization'):
        if col in existing_user_cols:
            op.drop_column('users', col)

    for idx_name, table_name in [
        ('ix_medical_code_encounter_id', 'medical_codes'),
        ('ix_invoice_status', 'invoices'),
        ('ix_invoice_patient_id', 'invoices'),
        ('ix_clinical_encounter_status', 'clinical_encounters'),
        ('ix_appointment_user_id', 'appointments'),
        ('ix_appointment_status', 'appointments'),
    ]:
        try:
            op.drop_index(idx_name, table_name=table_name)
        except Exception:
            pass

    for tbl in ('notifications', 'otp_verifications'):
        try:
            op.drop_table(tbl)
        except Exception:
            pass
