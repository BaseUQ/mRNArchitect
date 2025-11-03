import z from "zod/v4";
import {
  type AnalyzeResponse,
  OptimizationParameter,
  type OptimizationResult,
} from "~/api/types";
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
    cdsAnalysis: AnalyzeResponse;
    fivePrimeUtrAnalysis: AnalyzeResponse | null;
    threePrimeUtrAnalysis: AnalyzeResponse | null;
    fullSequenceAnalysis: AnalyzeResponse;
  };
  outputs: {
    optimization: OptimizationResult;
    cdsAnalysis: AnalyzeResponse;
    fullSequenceAnalysis: AnalyzeResponse;
  }[];
}
