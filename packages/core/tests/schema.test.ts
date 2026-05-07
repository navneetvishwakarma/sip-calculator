import { describe, it, expect } from 'vitest';
import { ScenarioResultSchema, ScenarioParamsSchema } from '../src/schema';

describe('ScenarioResultSchema', () => {
  it('parses a valid SIPResult', () => {
    const result = ScenarioResultSchema.parse({
      type: 'sip',
      inputs: { monthlyAmount: 10000, annualReturnPct: 12, years: 10 },
      summary: { totalInvested: 1200000, totalGains: 1123391, finalCorpus: 2323391 },
      yearlySnapshots: [],
    });
    expect(result.type).toBe('sip');
  });

  it('parses a valid SWPResult without yearlySnapshots (OQ-1 optional)', () => {
    const result = ScenarioResultSchema.parse({
      type: 'swp',
      inputs: { corpus: 5000000, monthlyWithdrawal: 30000, annualReturnPct: 12 },
      monthsToDepletion: 240,
    });
    expect(result.type).toBe('swp');
  });

  it('parses a perpetual SWPResult', () => {
    const result = ScenarioResultSchema.parse({
      type: 'swp',
      inputs: { corpus: 10000000, monthlyWithdrawal: 10000, annualReturnPct: 12 },
      monthsToDepletion: 'perpetual',
    });
    expect(result.monthsToDepletion).toBe('perpetual');
  });

  it('rejects invalid SIPResult (missing summary)', () => {
    expect(() => ScenarioResultSchema.parse({
      type: 'sip',
      inputs: { monthlyAmount: 10000, annualReturnPct: 12, years: 10 },
    })).toThrow();
  });
});

describe('ScenarioParamsSchema', () => {
  it('parses SIP params', () => {
    const p = ScenarioParamsSchema.parse({
      type: 'sip',
      monthlyAmount: 10000,
      annualReturnPct: 12,
      years: 10,
    });
    expect(p.type).toBe('sip');
  });

  it('rejects unknown type', () => {
    expect(() => ScenarioParamsSchema.parse({ type: 'unknown' })).toThrow();
  });
});
