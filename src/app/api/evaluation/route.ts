/**
 * GET /api/evaluation — Compute and return evaluation metrics.
 */

import { NextResponse } from 'next/server';
import { getServerClient } from '@/infra/supabase-server-client';

export async function GET() {
  try {
    const supabase = getServerClient();

    // Fetch all cases with invoices
    const { data: cases, error: casesError } = await supabase
      .from('recovery_cases')
      .select('*, invoices(*)');

    if (casesError) {
      return NextResponse.json({ error: casesError.message }, { status: 500 });
    }

    // Fetch all commitments
    const { data: commitments } = await supabase
      .from('commitments')
      .select('*');

    // Fetch all payments
    const { data: payments } = await supabase
      .from('payments')
      .select('*');

    // Fetch all reply parses
    const { data: replyParses } = await supabase
      .from('reply_parses')
      .select('*');

    // Fetch all audit events for override count
    const { data: auditEvents } = await supabase
      .from('audit_events')
      .select('*')
      .like('event_type', 'HUMAN_OVERRIDE%');

    const allCases = cases ?? [];
    const allCommitments = commitments ?? [];
    const allPayments = payments ?? [];
    const allParses = replyParses ?? [];

    // Calculate metrics
    const totalAmount = allCases.reduce(
      (sum, c) => sum + (c.invoices?.amount ?? 0),
      0
    );

    const recoveredAmount = allPayments.reduce(
      (sum, p) => sum + (p.amount ?? 0),
      0
    );

    const recoveryRate =
      totalAmount > 0 ? (recoveredAmount / totalAmount) * 100 : 0;

    // Promise-kept rate
    const keptCommitments = allCommitments.filter(
      (c) => c.status === 'KEPT'
    ).length;
    const totalCommitments = allCommitments.filter(
      (c) => c.status !== 'PENDING'
    ).length;
    const promiseKeptRate =
      totalCommitments > 0 ? (keptCommitments / totalCommitments) * 100 : 0;

    // False escalation rate
    const escalatedCases = allCases.filter(
      (c) => c.state === 'ESCALATED'
    );
    const falseEscalations = escalatedCases.filter((c) => {
      const casePayments = allPayments.filter(
        (p) => p.case_id === c.id
      );
      return casePayments.length > 0;
    });
    const falseEscalationRate =
      escalatedCases.length > 0
        ? (falseEscalations.length / escalatedCases.length) * 100
        : 0;

    // Dispute handling correctness
    const disputeCases = allCases.filter(
      (c) =>
        c.state === 'DISPUTE_OPEN' ||
        allCommitments.some(
          (cm) =>
            cm.case_id === c.id &&
            (cm.status === 'FROZEN' || cm.status === 'DISPUTE_FILED')
        )
    );
    const correctlyHandled = disputeCases.filter((c) => {
      const caseCommitments = allCommitments.filter(
        (cm) => cm.case_id === c.id
      );
      // A dispute is correctly handled if commitments were frozen, not cancelled
      return caseCommitments.some(
        (cm) => cm.status === 'FROZEN' || cm.status === 'KEPT' || cm.status === 'BROKEN'
      );
    });
    const disputeCorrectness =
      disputeCases.length > 0
        ? (correctlyHandled.length / disputeCases.length) * 100
        : 100;

    // Classification accuracy (based on reply parses)
    const validParses = allParses.filter((p) => p.schema_valid);
    const classificationAccuracy =
      allParses.length > 0
        ? (validParses.length / allParses.length) * 100
        : 100;

    // Hallucination rate
    const invalidParses = allParses.filter((p) => !p.schema_valid);
    const hallucinationRate =
      allParses.length > 0
        ? (invalidParses.length / allParses.length) * 100
        : 0;

    // Human override rate
    const overrideCount = auditEvents?.length ?? 0;
    const humanOverrideRate =
      allCases.length > 0 ? (overrideCount / allCases.length) * 100 : 0;

    // Scenario breakdown
    const scenarios = [
      {
        name: 'Clean promise, kept on time',
        count: allCases.filter((c) => c.state === 'CLOSED_PAID').length,
        total: Math.round(allCases.length * 0.3),
      },
      {
        name: 'Broken promise, no dispute',
        count: allCommitments.filter((c) => c.status === 'BROKEN').length,
        total: Math.round(allCases.length * 0.15),
      },
      {
        name: 'Promise, then dispute',
        count: disputeCases.length,
        total: Math.round(allCases.length * 0.1),
      },
      {
        name: 'Direct dispute',
        count: allCases.filter(
          (c) =>
            c.state === 'DISPUTE_OPEN' &&
            !allCommitments.some((cm) => cm.case_id === c.id)
        ).length,
        total: Math.round(allCases.length * 0.1),
      },
      {
        name: 'Ghost (no reply)',
        count: allCases.filter((c) => c.state === 'GHOSTED').length,
        total: Math.round(allCases.length * 0.15),
      },
      {
        name: 'Ambiguous reply',
        count: allParses.filter((p) => p.intent === 'AMBIGUOUS').length,
        total: Math.round(allCases.length * 0.1),
      },
      {
        name: 'Partial payment',
        count: allCases.filter((c) => c.state === 'CLOSED_PARTIAL').length,
        total: Math.round(allCases.length * 0.05),
      },
      {
        name: 'Unprompted direct payment',
        count: allPayments.filter((p) => {
          const relatedCase = allCases.find((c) => c.id === p.case_id);
          return (
            relatedCase &&
            !allCommitments.some((cm) => cm.case_id === relatedCase.id)
          );
        }).length,
        total: Math.round(allCases.length * 0.05),
      },
    ];

    return NextResponse.json({
      metrics: {
        recoveryRate: Number(recoveryRate.toFixed(1)),
        recoveredAmount,
        totalAmount,
        promiseKeptRate: Number(promiseKeptRate.toFixed(1)),
        falseEscalationRate: Number(falseEscalationRate.toFixed(1)),
        disputeCorrectness: Number(disputeCorrectness.toFixed(1)),
        classificationAccuracy: Number(classificationAccuracy.toFixed(1)),
        hallucinationRate: Number(hallucinationRate.toFixed(1)),
        humanOverrideRate: Number(humanOverrideRate.toFixed(1)),
      },
      scenarios,
      replyParses: allParses,
      totalCases: allCases.length,
    });
  } catch (err) {
    console.error('Evaluation API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
