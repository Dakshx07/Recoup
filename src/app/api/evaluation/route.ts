/**
 * GET /api/evaluation — Compute and return evaluation metrics derived strictly from PostgreSQL.
 */

import { NextResponse } from 'next/server';
import { getServerClient } from '@/infra/supabase-server-client';
import { calculateBenchmarkMetrics } from '@/lib/evaluation/benchmark';

export async function GET() {
  try {
    const supabase = getServerClient();

    // Query raw tables concurrently
    const [casesRes, commitmentsRes, paymentsRes, replyParsesRes, auditEventsRes] = await Promise.all([
      supabase.from('recovery_cases').select(`
        id, state, escalation_level, opened_at, updated_at, closed_at, closure_reason,
        invoices (
          id, invoice_number, original_amount, outstanding_amount, status,
          debtors ( id, name, contact_ref )
        )
      `),
      supabase.from('commitments').select('*'),
      supabase.from('payments').select('*'),
      supabase.from('reply_parses').select('*').order('created_at', { ascending: false }),
      supabase.from('audit_events').select('*'),
    ]);

    if (casesRes.error) {
      return NextResponse.json({ error: casesRes.error.message }, { status: 500 });
    }

    const cases = casesRes.data || [];
    const commitments = commitmentsRes.data || [];
    const payments = paymentsRes.data || [];
    const replyParses = replyParsesRes.data || [];
    const auditEvents = auditEventsRes.data || [];

    const metrics = calculateBenchmarkMetrics({
      cases,
      commitments,
      payments,
      replyParses,
      auditEvents,
    });

    return NextResponse.json({
      success: true,
      measured: true,
      metrics: {
        totalInvoiced: metrics.financials.totalInvoiced,
        totalRecovered: metrics.financials.totalRecovered,
        totalOutstanding: metrics.financials.totalOutstanding,
        recoveryRate: Number(metrics.financials.recoveryRate.toFixed(2)),
        totalCases: metrics.portfolio.totalCases,
        settledCases: metrics.portfolio.settledCases,
        settlementRate: Number(metrics.portfolio.settlementRate.toFixed(2)),
        resolvedPromiseHonorRate: metrics.commitments.resolvedPromiseHonorRate !== null
          ? Number(metrics.commitments.resolvedPromiseHonorRate.toFixed(2))
          : null,
        cleanPromiseHonorRate: metrics.commitments.cleanPromiseHonorRate !== null
          ? Number(metrics.commitments.cleanPromiseHonorRate.toFixed(2))
          : null,
        disputeFreezeAdherenceRate: metrics.policyAndSafety.disputeFreezeAdherenceRate !== null
          ? Number(metrics.policyAndSafety.disputeFreezeAdherenceRate.toFixed(2))
          : null,
        disputeCasesCount: metrics.policyAndSafety.disputeCasesCount,
        activeFrozenCommitmentsCount: metrics.policyAndSafety.activeFrozenCommitmentsCount,
        schemaValidityRate: metrics.llm.schemaValidityRate !== null
          ? Number(metrics.llm.schemaValidityRate.toFixed(2))
          : null,
        meanConfidence: metrics.llm.meanConfidence !== null
          ? Number(metrics.llm.meanConfidence.toFixed(4))
          : null,
        hallucinationRate: metrics.llm.hallucinationRate !== null
          ? Number(metrics.llm.hallucinationRate.toFixed(2))
          : null,
      },
      scenarios: metrics.scenarios,
      replyParses: replyParses.slice(0, 50),
    });
  } catch (err) {
    console.error('Evaluation API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
