/**
 * Audit Logger Service — convenience wrapper for inserting audit events.
 *
 * The state-transition service handles audit logging for state changes.
 * This service is for standalone audit events that don't involve state
 * transitions (e.g., outreach_drafted, debtor_reply_received).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Clock } from '@/domain/clock/clock.interface';
import { ActorType } from './state-transition.service';

export interface AuditEventInput {
  entityType: 'recovery_case' | 'commitment' | 'invoice' | 'payment';
  entityId: string;
  actor: ActorType;
  eventType: string;
  previousState?: string;
  newState?: string;
  reason?: string;
  details?: Record<string, unknown>;
  relatedIds?: Record<string, string>;
}

export class AuditLoggerService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly clock: Clock,
  ) {}

  async log(input: AuditEventInput): Promise<void> {
    const now = this.clock.now();

    const { error } = await this.db.from('audit_events').insert({
      entity_type: input.entityType,
      entity_id: input.entityId,
      actor: input.actor,
      event_type: input.eventType,
      previous_state: input.previousState ?? null,
      new_state: input.newState ?? null,
      reason: input.reason ?? null,
      details: input.details ?? null,
      related_ids: input.relatedIds ?? null,
      simulated_time: now.toISOString(),
    });

    if (error) {
      // Audit failures are logged but never throw — they should never
      // prevent the primary operation from completing.
      console.error(`[AUDIT_FAILURE] ${input.entityType}/${input.entityId}: ${error.message}`);
    }
  }
}
