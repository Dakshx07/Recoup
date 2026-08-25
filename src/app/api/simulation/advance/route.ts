/**
 * POST /api/simulation/advance — Advance simulated clock by N days, run cron checks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/infra/supabase-server-client';
import { SimulatedClock } from '@/domain/clock';
import { CronService } from '@/services/cron.service';
import { StateTransitionService } from '@/services/state-transition.service';

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

    // Get current simulated clock state from latest audit event
    const { data: latestAudit } = await supabase
      .from('audit_events')
      .select('simulated_time')
      .order('simulated_time', { ascending: false })
      .limit(1)
      .single();

    const currentDate = latestAudit?.simulated_time
      ? new Date(latestAudit.simulated_time)
      : new Date('2026-01-01T09:00:00+05:30');

    const clock = new SimulatedClock(currentDate);
    const stateTransition = new StateTransitionService(supabase, clock);
    const cron = new CronService(supabase, stateTransition, clock);

    const logs: string[] = [];

    // Advance day by day, running cron on each day
    for (let i = 0; i < days; i++) {
      clock.advanceByDays(1);
      const dayStr = clock.now().toISOString().split('T')[0];
      logs.push(`Day +${i + 1}: Advanced to ${dayStr}`);

      try {
        const result = await cron.runHourlyChecks();
        logs.push(`  → Evaluated ${result.processed} open cases (${result.escalated} escalated, ${result.brokenPromises} broken promises, ${result.writtenOff} written off)`);
      } catch (cronErr) {
        logs.push(`  ⚠ Cron notice: ${cronErr instanceof Error ? cronErr.message : 'Completed'}`);
      }
    }

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
