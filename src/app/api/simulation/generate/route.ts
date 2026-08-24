/**
 * POST /api/simulation/generate — Trigger synthetic data generation.
 */

import { NextResponse } from 'next/server';
import { getServerClient } from '@/infra/supabase-server-client';

export async function POST() {
  try {
    const supabase = getServerClient();

    // Count existing invoices to avoid duplicate generation
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      message:
        count && count > 0
          ? `${count} invoices already exist. Run 'npm run generate-synthetic-data' from the terminal to regenerate.`
          : "Run 'npm run generate-synthetic-data' from the terminal to generate synthetic data.",
      existingCount: count ?? 0,
    });
  } catch (err) {
    console.error('Generate API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
