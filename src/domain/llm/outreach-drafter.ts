/**
 * Outreach drafter — LLM integration for drafting debtor messages.
 *
 * Uses Google Gemini to generate context-aware message drafts.
 * The LLM has ZERO write permission — it produces a draft that the
 * system either sends automatically (if policy allows) or queues for
 * human review.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  OutreachDraft,
  validateOutreachDraft,
} from './schemas';
import { LLM_MAX_CORRECTIVE_REPROMPTS } from '../policy-engine/config';
import { EscalationLevel, RecoveryCaseState } from '../state-machine/recovery-case.states';

export interface OutreachDraftInput {
  merchantName: string;
  debtorName: string;
  invoiceNumber: string;
  invoiceAmount: number;
  outstandingAmount: number;
  currency: string;
  dueDate: string;
  caseState: RecoveryCaseState;
  escalationLevel: EscalationLevel;
  paymentLinkUrl?: string;
  previousMessages?: string[];
  context?: string; // Additional context (e.g., "Broken promise for 50k")
}

export interface OutreachDraftResult {
  output: OutreachDraft;
  modelVersion: string;
  schemaValid: boolean;
  repromptCount: number;
}

const OUTREACH_DRAFTER_SYSTEM_PROMPT = `You are an AI debt recovery agent working on behalf of a merchant.
Your task is to draft an outreach message to a debtor.

You MUST respond with valid JSON matching this exact schema:
{
  "subject": "<string, the subject line or message header>",
  "body": "<string, the main message content>",
  "tone": "professional" | "firm" | "empathetic",
  "includes_payment_link": <boolean>
}

Guidelines:
1. Tone: Start professional/empathetic. Move to firm if escalation level increases.
2. Clarity: Always state the outstanding amount and the merchant's name clearly.
3. Brevity: Keep messages concise. They may be sent via WhatsApp or email.
4. Payment Link: If a payment link URL is provided in the input, you MUST include it in the body and set includes_payment_link to true.
5. No hallucination: Do not invent fees, legal threats, or consequences not explicitly stated in the context.

RESPOND WITH JSON ONLY. No additional text or markdown formatting outside the JSON block.`;

export class OutreachDrafter {
  private genAI: GoogleGenerativeAI;
  private modelVersion: string;

  constructor(apiKey: string, modelVersion: string = 'gemini-2.0-flash') {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelVersion = modelVersion;
  }

  async draftMessage(input: OutreachDraftInput): Promise<OutreachDraftResult> {
    let repromptCount = 0;
    const userPrompt = this.buildUserPrompt(input);

    for (let attempt = 0; attempt <= LLM_MAX_CORRECTIVE_REPROMPTS; attempt++) {
      try {
        const model = this.genAI.getGenerativeModel({ model: this.modelVersion });
        const prompt = attempt === 0
          ? userPrompt
          : `Your previous response was not valid JSON or didn't match the required schema. Please try again.\n\n${userPrompt}`;

        const result = await model.generateContent([
          { text: OUTREACH_DRAFTER_SYSTEM_PROMPT },
          { text: prompt },
        ]);

        const responseText = result.response.text().trim();
        const cleanJson = responseText.replace(/^```json?\n?/, '').replace(/\n?```$/, '');

        let parsed: unknown;
        try {
          parsed = JSON.parse(cleanJson);
        } catch {
          repromptCount++;
          continue;
        }

        const validation = validateOutreachDraft(parsed);
        if (!validation.valid) {
          repromptCount++;
          continue;
        }

        return {
          output: validation.data,
          modelVersion: this.modelVersion,
          schemaValid: true,
          repromptCount,
        };
      } catch (error) {
        repromptCount++;
        if (attempt === LLM_MAX_CORRECTIVE_REPROMPTS) {
          return this.makeFallbackDraft(input, repromptCount);
        }
      }
    }

    return this.makeFallbackDraft(input, repromptCount);
  }

  private buildUserPrompt(input: OutreachDraftInput): string {
    let prompt = `Draft a message with the following context:

Merchant: ${input.merchantName}
Debtor: ${input.debtorName}
Invoice: ${input.invoiceNumber}
Outstanding Amount: ${input.currency} ${input.outstandingAmount.toLocaleString()} (Original: ${input.currency} ${input.invoiceAmount.toLocaleString()})
Original Due Date: ${input.dueDate}
Case State: ${input.caseState}
Escalation Level: ${input.escalationLevel}
`;

    if (input.paymentLinkUrl) {
      prompt += `Payment Link (MUST INCLUDE IN BODY): ${input.paymentLinkUrl}\n`;
    }
    if (input.context) {
      prompt += `Additional Context: ${input.context}\n`;
    }
    if (input.previousMessages?.length) {
      prompt += `\nPrevious messages in thread (for context):\n${input.previousMessages.map((m, i) => `${i + 1}. ${m}`).join('\n')}\n`;
    }

    return prompt;
  }

  /**
   * If the LLM completely fails (e.g., API down, constant schema failures),
   * fall back to a deterministic hardcoded template so the system doesn't crash.
   */
  private makeFallbackDraft(input: OutreachDraftInput, repromptCount: number): OutreachDraftResult {
    let body = `Hi ${input.debtorName}, this is a message on behalf of ${input.merchantName} regarding invoice ${input.invoiceNumber}. `;
    body += `The outstanding amount is ${input.currency} ${input.outstandingAmount.toLocaleString()}. `;
    
    if (input.paymentLinkUrl) {
      body += `Please pay using this link: ${input.paymentLinkUrl}`;
    } else {
      body += `Please let us know when we can expect payment.`;
    }

    return {
      output: {
        subject: `Update regarding invoice ${input.invoiceNumber}`,
        body,
        tone: 'professional',
        includes_payment_link: !!input.paymentLinkUrl,
      },
      modelVersion: 'fallback-template',
      schemaValid: false,
      repromptCount,
    };
  }
}
