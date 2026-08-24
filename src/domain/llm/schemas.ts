/**
 * LLM I/O schemas — the single source of truth for what the LLM produces.
 *
 * Every LLM output is validated against these schemas BEFORE any business
 * logic runs. Failed validation → AMBIGUOUS → human clarification.
 * Never coerced, never guessed.
 *
 * See 02_BACKEND_SPEC.md §5 for the LLM boundary specification.
 */

import { z } from 'zod';

// ─── Reply Parse Output ────────────────────────────────────────────────────

export const ParsedIntentType = z.enum([
  'PROMISE_CANDIDATE',
  'DISPUTE_CANDIDATE',
  'PAYMENT_CLAIM',
  'OTHER',
  'AMBIGUOUS',
]);
export type ParsedIntentType = z.infer<typeof ParsedIntentType>;

/**
 * The structured output schema for reply parsing.
 *
 * The LLM must produce exactly this shape. Any deviation → schema_valid=false
 * → AMBIGUOUS → one corrective re-prompt → if still fails, human clarification.
 */
export const ReplyParseOutputSchema = z.object({
  intent_type: ParsedIntentType,
  extracted_amount: z.number().positive().nullable(),
  extracted_date: z.string().nullable(), // ISO date string YYYY-MM-DD
  confidence: z.number().min(0).max(1),
  ambiguity_flags: z.array(z.string()).default([]),
  dispute_reason: z.string().nullable().default(null),
  raw_reasoning: z.string().optional(), // Non-authoritative explanation for audit
});
export type ReplyParseOutput = z.infer<typeof ReplyParseOutputSchema>;

// ─── Outreach Draft Output ─────────────────────────────────────────────────

export const OutreachDraftSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  tone: z.enum(['professional', 'firm', 'empathetic']),
  includes_payment_link: z.boolean(),
});
export type OutreachDraft = z.infer<typeof OutreachDraftSchema>;

// ─── Validation Helpers ────────────────────────────────────────────────────

/**
 * Validate raw LLM output against the reply parse schema.
 * Returns a discriminated union — never throws.
 */
export function validateReplyParseOutput(
  raw: unknown,
): { valid: true; data: ReplyParseOutput } | { valid: false; errors: string[] } {
  const result = ReplyParseOutputSchema.safeParse(raw);
  if (result.success) {
    return { valid: true, data: result.data };
  }
  return {
    valid: false,
    errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
  };
}

/**
 * Validate raw LLM output against the outreach draft schema.
 */
export function validateOutreachDraft(
  raw: unknown,
): { valid: true; data: OutreachDraft } | { valid: false; errors: string[] } {
  const result = OutreachDraftSchema.safeParse(raw);
  if (result.success) {
    return { valid: true, data: result.data };
  }
  return {
    valid: false,
    errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
  };
}
