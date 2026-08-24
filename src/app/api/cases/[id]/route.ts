/**
 * GET /api/cases/[id] — Fetch a single case with all related data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/infra/supabase-server-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getServerClient();

    // Fetch case with invoice
    const { data: caseData, error: caseError } = await supabase
      .from('recovery_cases')
      .select(
        `
        *,
        invoices (*),
        commitments (*),
        payments (*),
        debtor_replies (*),
        reply_parses (*)
      `
      )
      .eq('id', id)
      .single();

    if (caseError) {
      if (caseError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 });
      }
      return NextResponse.json({ error: caseError.message }, { status: 500 });
    }

    // Fetch audit events for this case
    const { data: auditEvents, error: auditError } = await supabase
      .from('audit_events')
      .select('*')
      .eq('entity_id', id)
      .order('created_at', { ascending: true });

    if (auditError) {
      console.error('Audit fetch error:', auditError);
    }

    return NextResponse.json({
      case: caseData,
      auditEvents: auditEvents ?? [],
    });
  } catch (err) {
    console.error('Case detail API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
