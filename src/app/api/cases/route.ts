/**
 * GET /api/cases — Fetch recovery cases with filtering, sorting, pagination.
 * Uses service-role client for full read access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/infra/supabase-server-client';

const ATTENTION_STATES = ['DISPUTE_OPEN', 'GHOSTED', 'ESCALATED'];

// Urgency ordering — escalated first, closed last
const STATE_URGENCY: Record<string, number> = {
  ESCALATED: 0,
  DISPUTE_OPEN: 1,
  GHOSTED: 2,
  COMMITMENT_ACTIVE: 3,
  AWAITING_REPLY: 4,
  REPLY_PROCESSING: 5,
  OPEN: 6,
  CLOSED_PAID: 7,
  CLOSED_PARTIAL: 8,
  CLOSED_WRITTEN_OFF: 9,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') ?? 'attention';
    const stateFilter = searchParams.get('state');
    const escalationFilter = searchParams.get('escalation');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const supabase = getServerClient();

    let query = supabase
      .from('recovery_cases')
      .select(
        `
        id,
        invoice_id,
        state,
        escalation_level,
        updated_at,
        opened_at,
        invoices (
          id,
          invoice_number,
          outstanding_amount,
          original_due_date,
          debtors (
            name
          )
        )
      `,
        { count: 'exact' }
      );

    // Tab filter
    if (tab === 'attention') {
      query = query.in('state', ATTENTION_STATES);
    }

    // State filter
    if (stateFilter) {
      const states = stateFilter.split(',');
      query = query.in('state', states);
    }

    // Escalation filter
    if (escalationFilter) {
      query = query.eq('escalation_level', escalationFilter);
    }

    // Search
    if (search) {
      query = query.or(
        `invoices.invoice_number.ilike.%${search}%`
      );
    }

    // Pagination
    if (limit > 0) {
      query = query.range(offset, offset + limit - 1);
    }

    // Sort by updated_at desc
    query = query.order('updated_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Cases fetch error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Sort by urgency
    const sorted = (data ?? []).sort((a, b) => {
      const urgencyA = STATE_URGENCY[a.state] ?? 99;
      const urgencyB = STATE_URGENCY[b.state] ?? 99;
      if (urgencyA !== urgencyB) return urgencyA - urgencyB;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return NextResponse.json({
      cases: sorted,
      total: count ?? 0,
      offset,
      limit,
    });
  } catch (err) {
    console.error('Cases API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
