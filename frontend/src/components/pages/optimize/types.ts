import z from "zod/v4";
import {
  type Analysis,
  OptimizationParameter,
  type OptimizationResult,
} from "~/types/optimize";
import { Sequence } from "~/types/sequence";

export const OptimizationInput = z.object({
  name: z.string(),
  numberOfSequences: z.int().positive().min(1).max(10),
  sequence: Sequence,
  parameters: z.array(OptimizationParameter).nonempty(),
});

export type OptimizationInput = z.infer<typeof OptimizationInput>;

export interface OptimizationOutput {
  input: {
    cdsAnalysis: Analysis;
    fivePrimeUtrAnalysis: Analysis | null;
    threePrimeUtrAnalysis: Analysis | null;
    fullSequenceAnalysis: Analysis;
  };
  outputs: {
    optimization: OptimizationResult;
    cdsAnalysis: Analysis;
    fullSequenceAnalysis: Analysis;
  }[];
}
