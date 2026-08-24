/**
 * POST /api/cases/[id]/override — Human override actions.
 * Requires auth + mandatory justification.
 * Routes through StateTransitionService.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/infra/supabase-server-client';
import { createClient } from '@/lib/supabase-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, justification } = body;

    // Validate justification
    if (!justification || justification.trim().length === 0) {
      return NextResponse.json(
        { error: 'Justification is required for all override actions' },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = [
      'resolve_dispute',
      'reject_dispute',
      'escalate',
      'write_off',
      'extend_commitment',
    ];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action: ${action}. Valid: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = getServerClient();

    // Fetch current case state
    const { data: caseData, error: fetchError } = await supabase
      .from('recovery_cases')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Determine new state based on action
    let newState: string;
    switch (action) {
      case 'resolve_dispute':
        newState = 'COMMITMENT_ACTIVE';
        break;
      case 'reject_dispute':
        newState = 'OPEN';
        break;
      case 'escalate':
        newState = 'ESCALATED';
        break;
      case 'write_off':
        newState = 'CLOSED_WRITTEN_OFF';
        break;
      case 'extend_commitment':
        newState = 'COMMITMENT_ACTIVE';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update case state
    const { error: updateError } = await supabase
      .from('recovery_cases')
      .update({
        state: newState,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Log audit event
    const { error: auditError } = await supabase.from('audit_events').insert({
      entity_type: 'recovery_case',
      entity_id: id,
      event_type: `HUMAN_OVERRIDE_${action.toUpperCase()}`,
      actor: 'HUMAN',
      summary: `Human override: ${action.replace('_', ' ')}. Justification: ${justification.trim()}`,
      detail: JSON.stringify({
        action,
        justification: justification.trim(),
        previous_state: caseData.state,
        new_state: newState,
        reviewer_email: user.email,
      }),
    });

    if (auditError) {
      console.error('Audit log error:', auditError);
    }

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
