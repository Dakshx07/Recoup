/**
 * Reply parser — LLM integration for parsing debtor replies.
 *
 * Uses Google Gemini to extract structured data from natural language.
 * The LLM has ZERO write permission — it produces a schema-validated
 * candidate that the Policy Engine independently evaluates.
 *
 * Validation pipeline:
 *   LLM output → JSON parse → Zod schema validation → confidence threshold
 *   Any failure → AMBIGUOUS → one corrective re-prompt → if still fails, AMBIGUOUS
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ReplyParseOutput,
  validateReplyParseOutput,
} from './schemas';
import {
  LLM_CONFIDENCE_THRESHOLD,
  LLM_MAX_CORRECTIVE_REPROMPTS,
} from '../policy-engine/config';

export interface ReplyParseInput {
  /** The raw text of the debtor's reply */
  replyText: string;
  /** Context about the case for the LLM */
  invoiceAmount: number;
  outstandingAmount: number;
  currency: string;
  previousMessages?: string[];
}

export interface ReplyParseResult {
  output: ReplyParseOutput;
  modelVersion: string;
  schemaValid: boolean;
  rawModelOutput: Record<string, unknown>;
  repromptCount: number;
}

const REPLY_PARSE_SYSTEM_PROMPT = `You are a structured data extraction system for a debt recovery platform.
Your task is to parse a debtor's reply and extract structured information.

You MUST respond with valid JSON matching this exact schema:
{
  "intent_type": "PROMISE_CANDIDATE" | "DISPUTE_CANDIDATE" | "PAYMENT_CLAIM" | "OTHER" | "AMBIGUOUS",
  "extracted_amount": <number or null>,
  "extracted_date": "<YYYY-MM-DD string or null>",
  "confidence": <number between 0 and 1>,
  "ambiguity_flags": ["<flag1>", "<flag2>"],
  "dispute_reason": "<string or null>",
  "raw_reasoning": "<brief explanation of your interpretation>"
}

Rules:
- PROMISE_CANDIDATE: debtor promises to pay a specific amount by a specific date
- DISPUTE_CANDIDATE: debtor disputes the invoice or amount
- PAYMENT_CLAIM: debtor claims they already paid
- OTHER: reply doesn't fit other categories
- AMBIGUOUS: unclear intent, missing information, or conflicting signals

- extracted_amount: only if debtor mentions a specific number
- extracted_date: only if debtor mentions a specific date (convert to YYYY-MM-DD)
- confidence: 0.0 to 1.0 — how sure you are about the intent classification
- ambiguity_flags: list any unclear aspects (e.g., "vague_date", "partial_amount", "conflicting_signals")
- dispute_reason: if intent is DISPUTE_CANDIDATE, briefly categorize the reason

You are extracting data, not making decisions. You have no authority to approve promises,
verify payments, or resolve disputes. You produce candidates for the Policy Engine to evaluate.

RESPOND WITH JSON ONLY. No additional text.`;

export class ReplyParser {
  private genAI: GoogleGenerativeAI;
  private modelVersion: string;

  constructor(apiKey: string, modelVersion: string = 'gemini-2.0-flash') {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelVersion = modelVersion;
  }

  /**
   * Parse a debtor reply into structured output.
   *
   * Implements the validation pipeline:
   * 1. Send to LLM with structured prompt
   * 2. Parse JSON response
   * 3. Validate against Zod schema
   * 4. Check confidence threshold
   * 5. On failure: one corrective re-prompt, then AMBIGUOUS
   */
  async parseReply(input: ReplyParseInput): Promise<ReplyParseResult> {
    let repromptCount = 0;
    let lastRawOutput: Record<string, unknown> = {};

    const userPrompt = this.buildUserPrompt(input);

    for (let attempt = 0; attempt <= LLM_MAX_CORRECTIVE_REPROMPTS; attempt++) {
      try {
        const model = this.genAI.getGenerativeModel({ model: this.modelVersion });
        const prompt = attempt === 0
          ? userPrompt
          : `Your previous response was not valid JSON or didn't match the required schema. Please try again.\n\n${userPrompt}`;

        const result = await model.generateContent([
          { text: REPLY_PARSE_SYSTEM_PROMPT },
          { text: prompt },
        ]);

        const responseText = result.response.text().trim();
        // Strip markdown code fences if present
        const cleanJson = responseText.replace(/^```json?\n?/, '').replace(/\n?```$/, '');

        // Step 2: Parse JSON
        let parsed: unknown;
        try {
          parsed = JSON.parse(cleanJson);
        } catch {
          repromptCount++;
          continue; // Invalid JSON — try corrective re-prompt
        }

        lastRawOutput = parsed as Record<string, unknown>;

        // Step 3: Validate against Zod schema
        const validation = validateReplyParseOutput(parsed);
        if (!validation.valid) {
          repromptCount++;
          continue; // Schema mismatch — try corrective re-prompt
        }

        // Step 4: Check confidence threshold
        // Low confidence → override to AMBIGUOUS (never trust a low-confidence classification)
        let output = validation.data;
        if (output.confidence < LLM_CONFIDENCE_THRESHOLD && output.intent_type !== 'AMBIGUOUS') {
          output = {
            ...output,
            intent_type: 'AMBIGUOUS',
            ambiguity_flags: [...output.ambiguity_flags, 'low_confidence_override'],
          };
        }

        return {
          output,
          modelVersion: this.modelVersion,
          schemaValid: true,
          rawModelOutput: lastRawOutput,
          repromptCount,
        };
      } catch (error) {
        repromptCount++;
        // LLM API error — try corrective re-prompt
        if (attempt === LLM_MAX_CORRECTIVE_REPROMPTS) {
          // All attempts exhausted — return AMBIGUOUS
          return this.makeAmbiguousResult(lastRawOutput, repromptCount, error);
        }
      }
    }

    // Shouldn't reach here, but safety fallback
    return this.makeAmbiguousResult(lastRawOutput, repromptCount);
  }

  private buildUserPrompt(input: ReplyParseInput): string {
    let prompt = `Invoice context:
- Outstanding amount: ${input.currency} ${input.outstandingAmount.toLocaleString()}
- Original invoice amount: ${input.currency} ${input.invoiceAmount.toLocaleString()}

Debtor's reply:
"${input.replyText}"`;

    if (input.previousMessages?.length) {
      prompt += `\n\nPrevious conversation context:\n${input.previousMessages.map((m, i) => `${i + 1}. ${m}`).join('\n')}`;
    }

    return prompt;
  }

  private makeAmbiguousResult(
    rawOutput: Record<string, unknown>,
    repromptCount: number,
    error?: unknown,
  ): ReplyParseResult {
    return {
      output: {
        intent_type: 'AMBIGUOUS',
        extracted_amount: null,
        extracted_date: null,
        confidence: 0,
        ambiguity_flags: ['schema_validation_failed', 'max_reprompts_exhausted'],
        dispute_reason: null,
        raw_reasoning: error instanceof Error ? error.message : 'Schema validation failed after all attempts',
      },
      modelVersion: this.modelVersion,
      schemaValid: false,
      rawModelOutput: rawOutput,
      repromptCount,
    };
  }
}
