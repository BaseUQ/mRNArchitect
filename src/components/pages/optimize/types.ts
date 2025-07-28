import z from "zod/v4";
import {
  type Analysis,
  Constraint,
  Objective,
  type OptimizationResult,
} from "~/types/optimize";
import { Sequence } from "~/types/sequence";

export const OptimizationInput = z.object({
  sequence: Sequence,
  constraints: z.array(Constraint),
  objectives: z.array(Objective),
  numberOfSequences: z.int().positive().min(1).max(10),
});

export type OptimizationInput = z.infer<typeof OptimizationInput>;

export interface OptimizationOutput {
  input: {
    cdsAnalysis: Analysis;
    fivePrimeUTRAnalysis: Analysis | null;
    threePrimeUTRAnalysis: Analysis | null;
    fullSequenceAnalysis: Analysis;
  };
  outputs: {
    optimization: OptimizationResult;
    cdsAnalysis: Analysis;
    fullSequenceAnalysis: Analysis;
  }[];
}
