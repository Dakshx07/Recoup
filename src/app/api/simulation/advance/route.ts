/**
 * POST /api/simulation/advance — Advance simulated clock by N days, run cron checks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/infra/supabase-server-client';
import { SimulatedClock } from '@/domain/clock';
import { CronService } from '@/services/cron.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const days = parseInt(body.days ?? '1', 10);

    if (isNaN(days) || days < 1 || days > 30) {
      return NextResponse.json(
        { error: 'Days must be between 1 and 30' },
        { status: 400 }
      );
    }

    const supabase = getServerClient();

    // Get or create simulated clock state
    const { data: clockState } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'simulated_clock')
      .single();

    const currentDate = clockState?.value
      ? new Date(clockState.value)
      : new Date();

    const clock = new SimulatedClock(currentDate);

    const logs: string[] = [];

    // Advance day by day, running cron on each day
    for (let i = 0; i < days; i++) {
      clock.advanceDays(1);
      logs.push(`Day ${i + 1}: Advanced to ${clock.now().toISOString().split('T')[0]}`);

      try {
        const cron = new CronService(supabase, clock);
        const results = await cron.runScheduledChecks();
        if (results && results.length > 0) {
          results.forEach((r: { caseId: string; action: string }) => {
            logs.push(`  → Case ${r.caseId}: ${r.action}`);
          });
        }
      } catch (cronErr) {
        logs.push(`  ⚠ Cron error: ${cronErr instanceof Error ? cronErr.message : 'Unknown'}`);
      }
    }

    // Save new clock state
    await supabase.from('system_config').upsert({
      key: 'simulated_clock',
      value: clock.now().toISOString(),
    });

    return NextResponse.json({
      success: true,
      currentDate: clock.now().toISOString(),
      daysAdvanced: days,
      logs,
    });
  } catch (err) {
    console.error('Simulation advance error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
