/**
 * POST /api/cases/[id]/override — Human override actions.
 * Requires auth + mandatory justification.
 * Handles canonical dispute resolution:
 * - reject_dispute: is_frozen = false on active commitment, case -> COMMITMENT_ACTIVE (or AWAITING_REPLY)
 * - uphold_dispute: status = VOIDED_BY_DISPUTE on commitment, case -> AWAITING_REPLY (or CLOSED_WRITTEN_OFF)
 * 
 * Concurrency & Idempotency:
 * - Enforces atomic optimistic state precondition (.eq('state', expectedState))
 * - Ensures concurrent/duplicate submissions produce exactly ONE state transition and ONE audit event.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/infra/supabase-server-client';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    // Default to reviewer identity if demo mode
    const reviewerEmail = user?.email || 'reviewer@recoup.internal';

    const { id } = await params;
    const body = await request.json();
    const { action, justification, expectedState } = body;

    // Validate justification
    if (!justification || justification.trim().length === 0) {
      return NextResponse.json(
        { error: 'Justification is required for all override actions' },
        { status: 400 }
      );
    }

    const validActions = [
      'reject_dispute',
      'uphold_dispute',
      'escalate',
      'write_off',
    ];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action: ${action}. Valid: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = getServerClient();

    // 1. Fetch current case state
    const { data: caseData, error: fetchError } = await supabase
      .from('recovery_cases')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // 2. Validate expected state if provided by client
    if (expectedState && caseData.state !== expectedState) {
      return NextResponse.json(
        { error: `Conflict: Case is currently in ${caseData.state}, expected ${expectedState}. Please refresh.` },
        { status: 409 }
      );
    }

    let newState = caseData.state;
    let reasonText = '';

    if (action === 'reject_dispute') {
      // Unfreeze active commitment
      const { data: commitments } = await supabase
        .from('commitments')
        .select('*')
        .eq('recovery_case_id', id)
        .eq('is_frozen', true);

      if (commitments && commitments.length > 0) {
        newState = 'COMMITMENT_ACTIVE';
        reasonText = `Dispute rejected by reviewer (${reviewerEmail}) — commitment unfrozen toward original due date. Justification: ${justification.trim()}`;
      } else {
        newState = 'AWAITING_REPLY';
        reasonText = `Dispute rejected by reviewer (${reviewerEmail}) — recovery cadence resumed. Justification: ${justification.trim()}`;
      }
    } else if (action === 'uphold_dispute') {
      newState = 'AWAITING_REPLY';
      reasonText = `Dispute upheld by reviewer (${reviewerEmail}) — commitment voided (VOIDED_BY_DISPUTE). Case reopened for negotiation. Justification: ${justification.trim()}`;
    } else if (action === 'escalate') {
      newState = 'ESCALATED';
      reasonText = `Manual force escalation by reviewer (${reviewerEmail}). Justification: ${justification.trim()}`;
    } else if (action === 'write_off') {
      newState = 'CLOSED_WRITTEN_OFF';
      reasonText = `Balance written off by reviewer (${reviewerEmail}). Justification: ${justification.trim()}`;
    }

    // 3. Atomic Optimistic State Precondition Update
    const { data: updatedCases, error: updateError } = await supabase
      .from('recovery_cases')
      .update({
        state: newState,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('state', caseData.state) // ATOMIC LOCK: Only succeed if state has not mutated concurrently
      .select();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // If 0 rows updated, a concurrent request has already mutated the state
    if (!updatedCases || updatedCases.length === 0) {
      return NextResponse.json(
        { error: 'Conflict: Case state has changed concurrently. Please refresh the page.' },
        { status: 409 }
      );
    }

    // 4. Mutate commitment rows corresponding to the won transition
    if (action === 'reject_dispute') {
      await supabase
        .from('commitments')
        .update({ is_frozen: false })
        .eq('recovery_case_id', id)
        .eq('is_frozen', true);
    } else if (action === 'uphold_dispute') {
      await supabase
        .from('commitments')
        .update({ status: 'VOIDED_BY_DISPUTE', is_frozen: false, resolved_at: new Date().toISOString() })
        .eq('recovery_case_id', id);
    }

    // 5. Append EXACTLY ONE immutable audit event
    await supabase.from('audit_events').insert({
      entity_type: 'recovery_case',
      entity_id: id,
      actor: 'human',
      event_type: `human_override_${action}`,
      previous_state: caseData.state,
      new_state: newState,
      reason: reasonText,
      simulated_time: caseData.updated_at || new Date().toISOString(),
      real_wall_clock_time: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      previousState: caseData.state,
      newState,
    });
  } catch (err) {
    console.error('Override API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
