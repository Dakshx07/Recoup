/**
 * Background Job Worker (Build-Order Step 7)
 *
 * Implements a transactional, strictly-ordered queue on top of PostgreSQL
 * using SELECT ... FOR UPDATE SKIP LOCKED.
 *
 * Why Postgres instead of Redis/Kafka:
 * - Solves the dual-write problem natively (state transitions and job queuing happen in the same transaction)
 * - Zero extra infrastructure complexity
 * - Easily handles MVP scale (~200 invoices)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ReplyParser } from '@/domain/llm/reply-parser';
import { StateTransitionService } from './state-transition.service';
import { Clock } from '@/domain/clock/clock.interface';
import { getServerClient } from '@/infra/supabase-server-client';
import { LiveClock } from '@/domain/clock/live-clock';

export interface JobPayload {
  caseId: string;
  [key: string]: unknown;
}

export interface ParseReplyPayload extends JobPayload {
  replyId: string;
  replyText: string;
}

export class QueueWorker {
  private isRunning = false;

  constructor(
    private readonly db: SupabaseClient,
    private readonly replyParser: ReplyParser,
    private readonly stateTransition: StateTransitionService,
    private readonly clock: Clock,
  ) {}

  /** Start the polling loop. */
  start(intervalMs = 5000) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[Worker] Started polling for jobs...');
    
    // In a real deployed environment, this would run continuously in a background process
    // or be triggered by pg_cron. For this MVP, we can run it in a loop.
    this.poll(intervalMs);
  }

  stop() {
    this.isRunning = false;
  }

  private async poll(intervalMs: number) {
    while (this.isRunning) {
      await this.processNextJob();
      // Sleep
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  /**
   * Process a single job using SELECT ... FOR UPDATE SKIP LOCKED
   */
  async processNextJob(): Promise<boolean> {
    // Note: Supabase JS client doesn't support FOR UPDATE SKIP LOCKED directly
    // through the query builder. We use an RPC call that we'll add to migrations.
    
    const { data: job, error } = await this.db.rpc('claim_next_job');

    if (error) {
      console.error('[Worker] Error claiming job:', error.message);
      return false;
    }

    if (!job || !job.id) {
      // No jobs pending
      return false;
    }

    console.log(`[Worker] Claimed job ${job.id} of type ${job.job_type}`);

    try {
      if (job.job_type === 'parse_reply') {
        await this.handleParseReply(job.payload as ParseReplyPayload);
      } else {
        throw new Error(`Unknown job type: ${job.job_type}`);
      }

      // Mark done
      await this.db
        .from('processing_jobs')
        .update({ status: 'done' })
        .eq('id', job.id);
      
      console.log(`[Worker] Job ${job.id} completed successfully`);
      return true;
    } catch (err) {
      console.error(`[Worker] Job ${job.id} failed:`, err);
      // Mark failed
      await this.db
        .from('processing_jobs')
        .update({
          status: 'failed',
          last_error: err instanceof Error ? err.message : String(err),
          attempts: (job.attempts || 0) + 1,
        })
        .eq('id', job.id);
        
      return false;
    }
  }

  private async handleParseReply(payload: ParseReplyPayload) {
    // 1. Fetch case context for the LLM
    const { data: currentCase, error: caseErr } = await this.db
      .from('recovery_cases')
      .select('id, invoices (original_amount, outstanding_amount, currency)')
      .eq('id', payload.caseId)
      .single();

    if (caseErr || !currentCase || Array.isArray(currentCase.invoices)) {
      throw new Error(`Could not fetch case context for case ${payload.caseId}`);
    }

    const invoice = currentCase.invoices as any; // typing shortcut

    // 2. Parse using the LLM
    const parseResult = await this.replyParser.parseReply({
      replyText: payload.replyText,
      invoiceAmount: invoice.original_amount,
      outstandingAmount: invoice.outstanding_amount,
      currency: invoice.currency,
    });

    // 3. Save the parsing result
    const { data: parseRow, error: insertErr } = await this.db
      .from('reply_parses')
      .insert({
        debtor_reply_id: payload.replyId,
        model_version: parseResult.modelVersion,
        parsed_intent_type: parseResult.output.intent_type,
        extracted_amount: parseResult.output.extracted_amount,
        extracted_date: parseResult.output.extracted_date,
        confidence: parseResult.output.confidence,
        raw_model_output: parseResult.rawModelOutput,
        schema_valid: parseResult.schemaValid,
      })
      .select()
      .single();

    if (insertErr || !parseRow) {
      throw new Error(`Failed to save reply parse: ${insertErr?.message}`);
    }

    // 4. In a real system, the policy engine would evaluate this candidate
    // right now to either accept it (transition to COMMITMENT_ACTIVE),
    // reject it, or move to AMBIGUOUS. For this MVP worker scaffolding,
    // we just leave the case in REPLY_PROCESSING until the simulation handles it.
  }
}
