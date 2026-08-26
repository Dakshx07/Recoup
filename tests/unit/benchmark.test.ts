import { describe, it, expect } from 'vitest';
import {
  calculateBenchmarkMetrics,
  extractScenarioFromContactRef,
  RawCaseInput,
  RawCommitmentInput,
  RawPaymentInput,
  RawReplyParseInput,
} from '@/lib/evaluation/benchmark';

describe('Benchmark Calculation Engine (Pure Logic Verification)', () => {
  it('extracts scenario correctly from contact_ref metadata', () => {
    expect(extractScenarioFromContactRef('scenario:clean_promise:0@demo.recoup.internal')).toBe('CLEAN_PROMISE');
    expect(extractScenarioFromContactRef('scenario:promise_then_dispute:12@demo.recoup.internal')).toBe('PROMISE_THEN_DISPUTE');
    expect(extractScenarioFromContactRef('invalid_ref')).toBe('UNCLASSIFIED');
    expect(extractScenarioFromContactRef(null)).toBe('UNCLASSIFIED');
    expect(extractScenarioFromContactRef(undefined)).toBe('UNCLASSIFIED');
  });

  it('handles empty datasets safely without division by zero errors', () => {
    const metrics = calculateBenchmarkMetrics({
      cases: [],
      commitments: [],
      payments: [],
      replyParses: [],
    });

    expect(metrics.financials.totalInvoiced).toBe(0);
    expect(metrics.financials.totalRecovered).toBe(0);
    expect(metrics.financials.totalOutstanding).toBe(0);
    expect(metrics.financials.recoveryRate).toBe(0);
    expect(metrics.portfolio.totalCases).toBe(0);
    expect(metrics.portfolio.settlementRate).toBe(0);
    expect(metrics.commitments.resolvedPromiseHonorRate).toBeNull();
    expect(metrics.commitments.cleanPromiseHonorRate).toBeNull();
    expect(metrics.policyAndSafety.disputeFreezeAdherenceRate).toBeNull();
    expect(metrics.llm.schemaValidityRate).toBeNull();
    expect(metrics.llm.meanConfidence).toBeNull();
    expect(metrics.scenarios).toEqual([]);
  });

  it('calculates exact recovery rate and financial totals for clean and partial cases', () => {
    const cases: RawCaseInput[] = [
      {
        id: 'c1',
        state: 'CLOSED_PAID',
        invoices: {
          id: 'i1',
          original_amount: 100000,
          outstanding_amount: 0,
          debtors: { contact_ref: 'scenario:clean_promise:1@demo.recoup.internal' },
        },
      },
      {
        id: 'c2',
        state: 'CLOSED_PARTIAL',
        invoices: {
          id: 'i2',
          original_amount: 50000,
          outstanding_amount: 20000,
          debtors: { contact_ref: 'scenario:partial_payment:2@demo.recoup.internal' },
        },
      },
      {
        id: 'c3',
        state: 'ESCALATED',
        invoices: {
          id: 'i3',
          original_amount: 50000,
          outstanding_amount: 50000,
          debtors: { contact_ref: 'scenario:ghost:3@demo.recoup.internal' },
        },
      },
    ];

    const commitments: RawCommitmentInput[] = [
      { id: 'cm1', status: 'KEPT', is_frozen: false },
      { id: 'cm2', status: 'PARTIALLY_KEPT', is_frozen: false },
    ];

    const replyParses: RawReplyParseInput[] = [
      { id: 'p1', schema_valid: true, confidence: 0.95 },
      { id: 'p2', schema_valid: true, confidence: 0.85 },
    ];

    const metrics = calculateBenchmarkMetrics({
      cases,
      commitments,
      payments: [],
      replyParses,
    });

    // Financials: Total invoiced = 200,000; Total outstanding = 70,000; Total recovered = 130,000
    expect(metrics.financials.totalInvoiced).toBe(200000);
    expect(metrics.financials.totalOutstanding).toBe(70000);
    expect(metrics.financials.totalRecovered).toBe(130000);
    expect(metrics.financials.recoveryRate).toBe(65);

    // Portfolio: 2 settled out of 3 = 66.67%
    expect(metrics.portfolio.totalCases).toBe(3);
    expect(metrics.portfolio.settledCases).toBe(2);
    expect(metrics.portfolio.activeCases).toBe(1);

    // Commitments: 2 resolved (2 kept/partial) = 100%
    expect(metrics.commitments.resolvedPromiseHonorRate).toBe(100);
    expect(metrics.commitments.cleanPromiseHonorRate).toBe(100);

    // LLM: 2 valid parses = 100%, mean confidence = 0.90
    expect(metrics.llm.schemaValidityRate).toBe(100);
    expect(metrics.llm.meanConfidence).toBe(0.90);
    expect(metrics.llm.hallucinationRate).toBe(0);
  });

  it('correctly handles zero original amount without NaN', () => {
    const cases: RawCaseInput[] = [
      {
        id: 'c1',
        state: 'OPEN',
        invoices: {
          original_amount: 0,
          outstanding_amount: 0,
        },
      },
    ];

    const metrics = calculateBenchmarkMetrics({
      cases,
      commitments: [],
      payments: [],
      replyParses: [],
    });

    expect(metrics.financials.recoveryRate).toBe(0);
    expect(isNaN(metrics.financials.recoveryRate)).toBe(false);
  });

  it('calculates dispute-freeze adherence and commitment metrics accurately', () => {
    const commitments: RawCommitmentInput[] = [
      { id: 'cm1', status: 'VALID_ACTIVE', is_frozen: true },
      { id: 'cm2', status: 'VALID_ACTIVE', is_frozen: true },
      { id: 'cm3', status: 'VOIDED_BY_DISPUTE', is_frozen: false },
      { id: 'cm4', status: 'BROKEN', is_frozen: false },
    ];

    const cases: RawCaseInput[] = [
      {
        id: 'c1',
        state: 'DISPUTE_OPEN',
        invoices: { original_amount: 10000, outstanding_amount: 10000, debtors: { contact_ref: 'scenario:direct_dispute:1' } },
      },
      {
        id: 'c2',
        state: 'DISPUTE_OPEN',
        invoices: { original_amount: 10000, outstanding_amount: 10000, debtors: { contact_ref: 'scenario:promise_then_dispute:2' } },
      },
    ];

    const metrics = calculateBenchmarkMetrics({
      cases,
      commitments,
      payments: [],
      replyParses: [],
    });

    expect(metrics.policyAndSafety.activeFrozenCommitmentsCount).toBe(2);
    expect(metrics.policyAndSafety.disputeFreezeAdherenceRate).toBe(100);
    expect(metrics.policyAndSafety.wrongfulCancellationCount).toBe(0);
  });
});
