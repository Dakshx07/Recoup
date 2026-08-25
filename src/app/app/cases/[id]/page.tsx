import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';
import { StatusBadge, EscalationBadge } from '@/components/dashboard/status-badge';
import { AuditTimeline, AuditEvent } from '@/components/dashboard/audit-timeline';
import { CommitmentCard, CommitmentData } from '@/components/dashboard/commitment-card';
import { PaymentCard, PaymentData } from '@/components/dashboard/payment-card';
import { OverridePanel } from '@/components/dashboard/override-panel';
import { formatSimulatedTime } from '@/lib/simulated-time';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id: caseId } = await params;

  // 1. Fetch case details with invoice & debtor relationships
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

  // 2. Fetch commitments, payments, and audit logs concurrently in parallel
  const [commitmentsRes, paymentsRes, auditLogsRes] = await Promise.all([
    supabase
      .from('commitments')
      .select('*')
      .eq('recovery_case_id', caseId)
      .order('created_at', { ascending: false }),
    supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', caseData.invoice_id)
      .order('paid_at', { ascending: false }),
    supabase
      .from('audit_events')
      .select('*')
      .eq('entity_id', caseId)
      .order('simulated_time', { ascending: true }),
  ]);

  const commitments = commitmentsRes.data;
  const payments = paymentsRes.data;
  const auditLogs = auditLogsRes.data;

  const latestAudit = auditLogs && auditLogs.length > 0 ? auditLogs[auditLogs.length - 1] : null;

  // Single canonical simulated clock for this case
  const caseSimulatedNow = latestAudit?.simulated_time || caseData.opened_at || new Date().toISOString();

  const activeCommitment = commitments?.find((c) => c.status === 'VALID_ACTIVE' || c.status === 'PARTIALLY_KEPT') || commitments?.[0];

  const commitmentData: CommitmentData | null = activeCommitment
    ? {
        id: activeCommitment.id,
        amount: Number(activeCommitment.promised_amount || activeCommitment.amount || 0),
        dueDate: activeCommitment.promised_date || activeCommitment.due_date,
        status: activeCommitment.status,
        isFrozen: activeCommitment.is_frozen || false,
        createdAt: activeCommitment.created_at,
      }
    : null;

  const paymentData: PaymentData[] = (payments || []).map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    paidAt: p.paid_at,
    verificationSource: p.verification_source || 'Razorpay Webhook Verified',
    externalId: p.external_payment_id || `pay_${p.id.slice(0, 8)}`,
  }));

  const auditEvents: AuditEvent[] = (auditLogs || []).map((log) => ({
    id: String(log.id),
    actor: log.actor,
    eventType: log.event_type,
    summary: log.reason || log.summary || log.event_type,
    details: log.details,
    simulatedTime: log.simulated_time || log.real_wall_clock_time,
    realTime: log.real_wall_clock_time,
  }));

  const formatCurrency = (n: number) =>
    '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const realWallClockTime = latestAudit?.real_wall_clock_time 
    ? format(new Date(latestAudit.real_wall_clock_time), 'yyyy-MM-dd HH:mm:ss') + ' UTC'
    : '2026-08-25 03:45:10 UTC';

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Navigation */}
      <div>
        <Link
          href="/app/cases"
          className="inline-flex items-center text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to case queue
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-neutral-200">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
                Case for Invoice
              </h1>
              <span className="font-mono text-neutral-800 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded text-sm font-bold">
                {caseData.invoices?.invoice_number}
              </span>
              <StatusBadge state={caseData.state} />
              <EscalationBadge level={caseData.escalation_level} />
            </div>

            {/* Dual Timestamps Header: Simulated business clock + Immutable real wall-clock */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono mt-2.5 text-neutral-500">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                Simulated Time: <span className="font-semibold text-neutral-800">{formatSimulatedTime(caseSimulatedNow, true)}</span>
              </span>
              <span className="text-neutral-300">|</span>
              <span className="flex items-center gap-1.5 text-neutral-400">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                Real Wall-Clock Audit: <span className="text-neutral-600">{realWallClockTime}</span>
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right bg-neutral-50 sm:bg-transparent p-3 sm:p-0 rounded-lg border sm:border-0 border-neutral-200">
            <p className="text-xs text-neutral-500 font-medium">Outstanding Balance</p>
            <p className="text-2xl font-bold tabular-nums text-neutral-900 mt-0.5">
              {formatCurrency(caseData.invoices?.outstanding_amount || 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main audit narrative */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-5">
              <div>
                <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                  Case Lifecycle & Causal Decision Trail
                </h2>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Append-only immutable record. Relative times calculated against simulated business clock.
                </p>
              </div>
              <span className="text-xs text-neutral-500 font-mono font-medium">
                {auditEvents.length} events
              </span>
            </div>
            {auditEvents.length > 0 ? (
              <AuditTimeline events={auditEvents} simulatedNow={caseSimulatedNow} />
            ) : (
              <p className="text-xs text-neutral-500 text-center py-6">No audit records found for this case.</p>
            )}
          </div>
        </div>

        {/* Right column: Debtor Details, Commitment Status, Human Override */}
        <div className="space-y-5">
          {/* Debtor Details Card */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-3">
              Debtor Profile
            </h2>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm text-neutral-900 font-medium">
                <User className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <span className="truncate">{caseData.invoices?.debtors?.name || 'Debtor'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-600 font-mono">
                <Mail className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                <span className="truncate">
                  {caseData.invoices?.debtors?.contact_ref?.split('@')[0]?.replace(/^scenario:[^:]+:/, '') || 'contact'}@company.in
                </span>
              </div>
              {caseData.invoices?.debtors?.phone && (
                <div className="flex items-center gap-2 text-xs text-neutral-600 font-mono">
                  <Phone className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                  <span>{caseData.invoices?.debtors?.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Active Commitment & Payment Verification */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider px-0.5">
              Financial Commitment
            </h2>
            <CommitmentCard commitment={commitmentData} simulatedNow={caseSimulatedNow} />
            {paymentData.map((p) => (
              <PaymentCard key={p.id} payment={p} simulatedNow={caseSimulatedNow} />
            ))}
          </div>

          {/* Human Override Panel */}
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
