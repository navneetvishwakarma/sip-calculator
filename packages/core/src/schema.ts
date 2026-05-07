import { z } from 'zod';

// ── Shared building blocks ────────────────────────────────────────────────────

export const YearlySnapshotSchema = z.object({
  year: z.number().int().positive(),
  monthlyInvestment: z.number().nonnegative(),
  totalInvested: z.number().nonnegative(),
  interestEarned: z.number(),
  corpusValue: z.number().nonnegative(),
});

const SummarySchema = z.object({
  totalInvested: z.number(),
  totalGains: z.number(),
  finalCorpus: z.number(),
});

// ── Per-calculator input-only schemas (no type discriminant — used in result inputs field) ───
// These are the raw numeric inputs stored inside each result's `inputs` field.
// They do NOT carry `type` — the parent result schema is already discriminated.

const SIPInputsSchema = z.object({
  monthlyAmount: z.number().positive(),
  annualReturnPct: z.number().positive(),
  years: z.number().int().positive(),
});

const GoalInputsSchema = z.object({
  targetCorpus: z.number().positive(),
  annualReturnPct: z.number().positive(),
  years: z.number().int().positive(),
});

const LumpSumInputsSchema = z.object({
  principal: z.number().positive(),
  annualReturnPct: z.number().positive(),
  years: z.number().int().positive(),
});

const StepUpInputsSchema = z.object({
  monthlyAmount: z.number().positive(),
  stepUpPct: z.number().nonnegative(),
  annualReturnPct: z.number().positive(),
  years: z.number().int().positive(),
});

const HybridInputsSchema = z.object({
  monthlyAmount: z.number().positive(),
  lumpSumAmount: z.number().positive(),
  annualReturnPct: z.number().positive(),
  years: z.number().int().positive(),
});

const SWPInputsSchema = z.object({
  corpus: z.number().positive(),
  monthlyWithdrawal: z.number().positive(),
  annualReturnPct: z.number().positive(),
});

// ── Per-calculator Params schemas (with type discriminant — for ScenarioParamsSchema) ───
// These carry `type` for URL encoding (Phase 4) and DB serialization (Phase 6).

const SIPParamsSchema = z.object({
  type: z.literal('sip'),
  monthlyAmount: z.number().positive(),
  annualReturnPct: z.number().positive(),
  years: z.number().int().positive(),
});

const GoalParamsSchema = z.object({
  type: z.literal('goal'),
  targetCorpus: z.number().positive(),
  annualReturnPct: z.number().positive(),
  years: z.number().int().positive(),
});

const LumpSumParamsSchema = z.object({
  type: z.literal('lumpsum'),
  principal: z.number().positive(),
  annualReturnPct: z.number().positive(),
  years: z.number().int().positive(),
});

const StepUpParamsSchema = z.object({
  type: z.literal('stepup'),
  monthlyAmount: z.number().positive(),
  stepUpPct: z.number().nonnegative(),
  annualReturnPct: z.number().positive(),
  years: z.number().int().positive(),
});

const HybridParamsSchema = z.object({
  type: z.literal('hybrid'),
  monthlyAmount: z.number().positive(),
  lumpSumAmount: z.number().positive(),
  annualReturnPct: z.number().positive(),
  years: z.number().int().positive(),
});

const SWPParamsSchema = z.object({
  type: z.literal('swp'),
  corpus: z.number().positive(),
  monthlyWithdrawal: z.number().positive(),
  annualReturnPct: z.number().positive(),
});

// ── Per-calculator Result schemas ─────────────────────────────────────────────

const SIPResultSchema = z.object({
  type: z.literal('sip'),
  inputs: SIPInputsSchema,
  summary: SummarySchema,
  yearlySnapshots: z.array(YearlySnapshotSchema),
});

const GoalResultSchema = z.object({
  type: z.literal('goal'),
  inputs: GoalInputsSchema,
  monthlyRequired: z.number().positive(),
  summary: SummarySchema,
  yearlySnapshots: z.array(YearlySnapshotSchema),
});

const LumpSumResultSchema = z.object({
  type: z.literal('lumpsum'),
  inputs: LumpSumInputsSchema,
  summary: SummarySchema,
  yearlySnapshots: z.array(YearlySnapshotSchema),
});

const StepUpResultSchema = z.object({
  type: z.literal('stepup'),
  inputs: StepUpInputsSchema,
  summary: SummarySchema,
  yearlySnapshots: z.array(YearlySnapshotSchema),
});

const HybridResultSchema = z.object({
  type: z.literal('hybrid'),
  inputs: HybridInputsSchema,
  summary: SummarySchema,
  yearlySnapshots: z.array(YearlySnapshotSchema),
});

// SWP: no summary, optional yearlySnapshots for Phase 3 drawdown chart (OQ-1 resolved)
const SWPResultSchema = z.object({
  type: z.literal('swp'),
  inputs: SWPInputsSchema,
  monthsToDepletion: z.union([z.number().int().positive(), z.literal('perpetual')]),
  yearlySnapshots: z.array(YearlySnapshotSchema).optional(),
});

// ── Top-level discriminated union exports ─────────────────────────────────────

export const ScenarioResultSchema = z.discriminatedUnion('type', [
  SIPResultSchema,
  GoalResultSchema,
  LumpSumResultSchema,
  StepUpResultSchema,
  HybridResultSchema,
  SWPResultSchema,
]);

export const ScenarioParamsSchema = z.discriminatedUnion('type', [
  SIPParamsSchema,
  GoalParamsSchema,
  LumpSumParamsSchema,
  StepUpParamsSchema,
  HybridParamsSchema,
  SWPParamsSchema,
]);

// Inferred TypeScript types — use these for function signatures
export type YearlySnapshot = z.infer<typeof YearlySnapshotSchema>;
export type ScenarioResult = z.infer<typeof ScenarioResultSchema>;
export type ScenarioParams = z.infer<typeof ScenarioParamsSchema>;

// Per-calculator result types for narrow typing in calculator files
export type SIPResult = z.infer<typeof SIPResultSchema>;
export type GoalResult = z.infer<typeof GoalResultSchema>;
export type LumpSumResult = z.infer<typeof LumpSumResultSchema>;
export type StepUpResult = z.infer<typeof StepUpResultSchema>;
export type HybridResult = z.infer<typeof HybridResultSchema>;
export type SWPResult = z.infer<typeof SWPResultSchema>;
