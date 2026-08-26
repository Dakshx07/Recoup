import { RecoveryCaseState, EscalationLevel } from '@/domain/state-machine/recovery-case.states';
import { CommitmentStatus } from '@/domain/state-machine/commitment.states';

export interface InvoiceFixture {
  id: string;
  merchant_id: string;
  external_id: string;
  debtor_name: string;
  debtor_email: string;
  original_amount: number;
  outstanding_amount: number;
  currency: string;
  due_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CaseFixture {
  id: string;
  invoice_id: string;
  state: RecoveryCaseState;
  escalation_level: EscalationLevel;
  opened_at: string;
  updated_at: string;
  closed_at: string | null;
  closure_reason: string | null;
}

export interface CommitmentFixture {
  id: string;
  recovery_case_id: string;
  amount: number;
  due_date: string;
  status: CommitmentStatus;
  is_frozen: boolean;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface PaymentLinkFixture {
  id: string;
  invoice_id: string;
  external_link_id: string;
  created_at: string;
}

export interface PaymentFixture {
  id: string;
  invoice_id: string;
  payment_link_id: string;
  external_payment_id: string;
  amount: number;
  paid_at: string;
  verification_source: string;
  raw_webhook_payload?: any;
}

export function createInvoiceFixture(overrides: Partial<InvoiceFixture> = {}): InvoiceFixture {
  return {
    id: overrides.id || 'inv_test_001',
    merchant_id: overrides.merchant_id || 'mer_test_001',
    external_id: overrides.external_id || 'INV-2026-001',
    debtor_name: overrides.debtor_name || 'Acme Logistics Corp',
    debtor_email: overrides.debtor_email || 'accounts@acmelogistics.com',
    original_amount: overrides.original_amount ?? 50000,
    outstanding_amount: overrides.outstanding_amount ?? 50000,
    currency: overrides.currency || 'INR',
    due_date: overrides.due_date || '2026-01-01T00:00:00Z',
    status: overrides.status || 'OPEN',
    created_at: overrides.created_at || '2026-01-01T00:00:00Z',
    updated_at: overrides.updated_at || '2026-01-01T00:00:00Z',
  };
}

export function createCaseFixture(overrides: Partial<CaseFixture> = {}): CaseFixture {
  return {
    id: overrides.id || 'case_test_001',
    invoice_id: overrides.invoice_id || 'inv_test_001',
    state: overrides.state || RecoveryCaseState.OPEN,
    escalation_level: overrides.escalation_level || EscalationLevel.NONE,
    opened_at: overrides.opened_at || '2026-01-01T09:00:00Z',
    updated_at: overrides.updated_at || '2026-01-01T09:00:00Z',
    closed_at: overrides.closed_at || null,
    closure_reason: overrides.closure_reason || null,
  };
}

export function createCommitmentFixture(overrides: Partial<CommitmentFixture> = {}): CommitmentFixture {
  return {
    id: overrides.id || 'com_test_001',
    recovery_case_id: overrides.recovery_case_id || 'case_test_001',
    amount: overrides.amount ?? 50000,
    due_date: overrides.due_date || '2026-01-10T12:00:00Z',
    status: overrides.status || CommitmentStatus.VALID_ACTIVE,
    is_frozen: overrides.is_frozen ?? false,
    created_at: overrides.created_at || '2026-01-03T11:00:00Z',
    updated_at: overrides.updated_at || '2026-01-03T11:00:00Z',
    resolved_at: overrides.resolved_at || null,
  };
}

export function createPaymentLinkFixture(overrides: Partial<PaymentLinkFixture> = {}): PaymentLinkFixture {
  return {
    id: overrides.id || 'plink_test_001',
    invoice_id: overrides.invoice_id || 'inv_test_001',
    external_link_id: overrides.external_link_id || 'plink_ext_001',
    created_at: overrides.created_at || '2026-01-01T09:00:00Z',
  };
}

export function createPaymentFixture(overrides: Partial<PaymentFixture> = {}): PaymentFixture {
  return {
    id: overrides.id || 'pay_test_001',
    invoice_id: overrides.invoice_id || 'inv_test_001',
    payment_link_id: overrides.payment_link_id || 'plink_test_001',
    external_payment_id: overrides.external_payment_id || 'pay_ext_001',
    amount: overrides.amount ?? 50000,
    paid_at: overrides.paid_at || '2026-01-10T12:00:00Z',
    verification_source: overrides.verification_source || 'webhook_plus_api_check',
    raw_webhook_payload: overrides.raw_webhook_payload || { status: 'captured' },
  };
}
