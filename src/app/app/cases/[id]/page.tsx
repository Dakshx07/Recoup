import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Phone, Mail } from 'lucide-react';
import { StatusBadge, EscalationBadge } from '@/components/dashboard/status-badge';
import { AuditTimeline, AuditEvent } from '@/components/dashboard/audit-timeline';
import { CommitmentCard, CommitmentData } from '@/components/dashboard/commitment-card';
import { PaymentCard, PaymentData } from '@/components/dashboard/payment-card';
import { OverridePanel } from '@/components/dashboard/override-panel';

export const dynamic = 'force-dynamic';

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id: caseId } = await params;

  const { data: caseData, error } = await supabase
    .from('recovery_cases')
    .select(`
      *,
      invoices (
        *,
        debtors (*)
      )
    `)
    .eq('id', caseId)
    .single();

  if (error || !caseData) {
    notFound();
  }

  // Fetch commitments
  const { data: commitments } = await supabase
    .from('commitments')
    .select('*')
    .eq('recovery_case_id', caseId)
    .order('created_at', { ascending: false });

  // Fetch payments
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_number', caseData.invoices.invoice_number)
    .order('paid_at', { ascending: false });

  // Fetch audit events
  const { data: auditLogs } = await supabase
    .from('audit_events')
    .select('*')
    .eq('entity_id', caseId)
    .order('simulated_time', { ascending: true }); // chronological

  const activeCommitment = commitments?.find((c) => c.status === 'VALID_ACTIVE' || c.status === 'PARTIALLY_KEPT') || commitments?.[0];

  const commitmentData: CommitmentData | null = activeCommitment
    ? {
        id: activeCommitment.id,
        amount: activeCommitment.promised_amount,
        dueDate: activeCommitment.promised_date,
        status: activeCommitment.status,
        isFrozen: activeCommitment.is_frozen,
        createdAt: activeCommitment.created_at,
      }
    : null;

  const paymentData: PaymentData[] = (payments || []).map((p) => ({
    id: p.id,
    amount: p.amount,
    paidAt: p.paid_at,
    verificationSource: 'Razorpay webhook',
    externalId: p.external_payment_id,
  }));

  const auditEvents: AuditEvent[] = (auditLogs || []).map((log) => ({
    id: log.id,
    actor: log.actor,
    eventType: log.event_type,
    summary: log.summary,
    details: log.details,
    simulatedTime: log.simulated_time,
    realTime: log.real_wall_clock_time,
  }));

  const formatCurrency = (n: number) =>
    '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Breadcrumb */}
      <div>
        <Link
          href="/app/cases"
          className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to case queue
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
                Case for Invoice{' '}
                <span className="font-mono text-neutral-500 text-xl">
                  {caseData.invoices.invoice_number}
                </span>
              </h1>
              <StatusBadge state={caseData.state} />
              <EscalationBadge level={caseData.escalation_level} />
            </div>
            <p className="text-sm text-neutral-500 mt-2">
              Opened on {new Date(caseData.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-500 font-medium">Outstanding</p>
            <p className="text-2xl font-semibold tabular-nums text-neutral-900 mt-1">
              {formatCurrency(caseData.invoices.outstanding_amount)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-6">
              Audit Trail
            </h2>
            {auditEvents.length > 0 ? (
              <AuditTimeline events={auditEvents} />
            ) : (
              <p className="text-sm text-neutral-500">No events recorded yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar: Debtor, Commitment, Override */}
        <div className="space-y-6">
          {/* Debtor Info */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-4">
              Debtor Details
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-neutral-900 font-medium">
                <User className="w-4 h-4 text-neutral-400" />
                {caseData.invoices.debtors.name}
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Mail className="w-4 h-4 text-neutral-400" />
                {caseData.invoices.debtors.email}
              </div>
              {caseData.invoices.debtors.phone && (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Phone className="w-4 h-4 text-neutral-400" />
                  {caseData.invoices.debtors.phone}
                </div>
              )}
            </div>
          </div>

          {/* Active Commitment */}
          <div>
            <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-3 px-1">
              Commitment
            </h2>
            <CommitmentCard commitment={commitmentData} />
            {paymentData.map((p) => (
              <PaymentCard key={p.id} payment={p} />
            ))}
          </div>

          {/* Human Override */}
          <OverridePanel
            caseId={caseData.id}
            currentState={caseData.state}
            hasFrozenCommitment={commitmentData?.isFrozen || false}
          />
        </div>
      </div>
    </div>
  );
}
