/**
 * GET /api/audit — Global audit log with filters.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/infra/supabase-server-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');
    const actor = searchParams.get('actor');
    const eventType = searchParams.get('event_type');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') ?? '100', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const supabase = getServerClient();

    let query = supabase
      .from('audit_events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (entityType) query = query.eq('entity_type', entityType);
    if (actor) query = query.eq('actor', actor);
    if (eventType) query = query.eq('event_type', eventType);
    if (search) {
      query = query.or(
        `entity_id.eq.${search},summary.ilike.%${search}%`
      );
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      events: data ?? [],
      total: count ?? 0,
      offset,
      limit,
    });
  } catch (err) {
    console.error('Audit API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
