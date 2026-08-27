/**
 * Cron Service (Build-Order Step 11)
 *
 * Encapsulates the scheduled checks that run periodically (e.g., hourly).
 * In production, this would be triggered by pg_cron or a serverless function.
 * In the simulation harness, this is called manually at each time step.
 *
 * Responsibilities:
 * - Evaluate the Escalation Ladder for all open cases
 * - Move cases that have exhausted their timeline to CLOSED_WRITTEN_OFF or legal hold
 * - Identify and process Broken Promises (where the due date has passed)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Clock } from '@/domain/clock/clock.interface';
import { StateTransitionService } from './state-transition.service';
import {
  evaluateEscalation,
  EscalationResult,
} from '@/domain/policy-engine/escalation-ladder';
// import removed
import { RecoveryCaseState, EscalationLevel } from '@/domain/state-machine/recovery-case.states';
import { CommitmentStatus } from '@/domain/state-machine/commitment.states';

export class CronService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly stateTransition: StateTransitionService,
    private readonly clock: Clock,
  ) {}

  /**
   * Run all scheduled checks.
   *
   * 1. Check for broken promises
   * 2. Evaluate escalation ladder
   * 3. Evaluate stopping rules (e.g., max duration reached)
   */
  async runHourlyChecks(): Promise<{ processed: number; escalated: number; brokenPromises: number; writtenOff: number }> {
    let escalatedCount = 0;
    let brokenPromisesCount = 0;
    let writtenOffCount = 0;
    const now = this.clock.now();

    // 1. Process broken promises
    // Find any VALID_ACTIVE commitments where the due date is in the past
    const { data: brokenCommitments } = await this.db
      .from('commitments')
      .select('id, recovery_case_id, due_date')
      .eq('status', 'VALID_ACTIVE')
      .eq('is_frozen', false) // Don't auto-break frozen/disputed commitments
      .lt('due_date', now.toISOString());

    if (brokenCommitments) {
      for (const commitment of brokenCommitments) {
        const result = await this.stateTransition.transitionCommitment({
          commitmentId: commitment.id,
          caseId: commitment.recovery_case_id,
          newStatus: CommitmentStatus.BROKEN,
          actor: 'system',
          eventType: 'commitment_broken_due_date_passed',
          reason: `Due date ${commitment.due_date} passed without full payment`,
        });

        if (result.success) {
          brokenPromisesCount++;
          // Also transition the case back to AWAITING_REPLY so the ladder catches it
          await this.stateTransition.transitionCase({
            caseId: commitment.recovery_case_id,
            newState: RecoveryCaseState.AWAITING_REPLY,
            actor: 'system',
            eventType: 'case_reopened_broken_promise',
            reason: 'Commitment was broken',
          });
        }
      }
    }

    // 2. Process Escalations & Write-Offs
    // We only evaluate open cases
    const terminalStates = ['CLOSED_PAID', 'CLOSED_PARTIAL', 'CLOSED_WRITTEN_OFF'];
    const { data: openCases, error } = await this.db
      .from('recovery_cases')
      .select(`
        id,
        state,
        escalation_level,
        opened_at,
        updated_at,
        invoices ( outstanding_amount )
      `)
      .not('state', 'in', `(${terminalStates.join(',')})`);

    if (error) {
      console.error('Error fetching open cases:', error);
    }

    if (openCases && openCases.length > 0) {
      // Process open cases in parallel batches to optimize network roundtrips
      const BATCH_SIZE = 15;
      for (let i = 0; i < openCases.length; i += BATCH_SIZE) {
        const batch = openCases.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (recoveryCase) => {
            const state = recoveryCase.state as RecoveryCaseState;
            const level = recoveryCase.escalation_level as EscalationLevel;
            const createdAt = new Date(recoveryCase.opened_at);
            const lastContactAt = new Date(recoveryCase.updated_at);

            // A. Check Stopping Rules (Max 90 days duration -> WRITE_OFF)
            const daysOpen = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
            if (daysOpen >= 90) {
              const res = await this.stateTransition.transitionCase({
                caseId: recoveryCase.id,
                newState: RecoveryCaseState.CLOSED_WRITTEN_OFF,
                actor: 'system',
                eventType: 'max_duration_exhausted',
                reason: `Case reached max duration of 90 days (open for ${daysOpen} days)`,
              });
              if (res.success) writtenOffCount++;
              return;
            }

            // B. Check Escalation Ladder
            const escalation = evaluateEscalation({
              caseOpenedAt: createdAt,
              currentEscalationLevel: level,
              outreachCount: 1, // simplified for MVP sim
              brokenPromiseCount: 0,
              hasActiveCommitment: state === RecoveryCaseState.COMMITMENT_ACTIVE,
              lastOutreachAt: lastContactAt,
            }, this.clock);

            if (escalation.shouldEscalate && escalation.newLevel) {
              if (escalation.action === 'ESCALATE_TO_HUMAN') {
                const res = await this.stateTransition.transitionCase({
                  caseId: recoveryCase.id,
                  newState: RecoveryCaseState.ESCALATED,
                  actor: 'system',
                  eventType: 'case_escalated_to_human_review',
                  reason: escalation.reason,
                  additionalUpdates: { escalation_level: escalation.newLevel },
                });
                if (res.success) escalatedCount++;
              } else {
                // Level bump (Reminder 2 / Reminder 3) within active recovery cadence
                await this.db
                  .from('recovery_cases')
                  .update({
                    escalation_level: escalation.newLevel,
                    updated_at: now.toISOString(),
                  })
                  .eq('id', recoveryCase.id);

                await this.db.from('audit_events').insert({
                  entity_type: 'recovery_case',
                  entity_id: recoveryCase.id,
                  actor: 'policy_engine',
                  event_type: 'escalation_reminder_dispatched',
                  previous_state: state,
                  new_state: state,
                  reason: escalation.reason,
                  simulated_time: now.toISOString(),
                });
                escalatedCount++;
              }
            }
          })
        );
      }
    }

    return {
      processed: (openCases?.length || 0),
      escalated: escalatedCount,
      brokenPromises: brokenPromisesCount,
      writtenOff: writtenOffCount,
    };
  }
}
