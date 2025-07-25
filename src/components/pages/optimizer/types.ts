import { Constraint, Objective } from "~/types/optimize";
import { Sequence } from "~/types/sequence";

export interface OptimizationForm {
  sequence: Sequence;
  constraints: Constraint[];
  objectives: Objective[];
}
