import z from "zod";

export const OptimizationRequest = z.object({
  sequenceType: z.union([z.literal("nucleic-acid"), z.literal("amino-acid")]),
  sequence: z.string().nonempty("Coding sequence is required."),
  fivePrimeUTR: z.string(),
  threePrimeUTR: z.string(),
  polyATail: z.string(),
  numberOfSequences: z.number().int().min(1).max(10),
  organism: z.string(),
  enableUridineDepletion: z.boolean(),
  avoidRibosomeSlip: z.boolean(),
  gcContentMin: z.number().min(0).max(1),
  gcContentMax: z.number().min(0).max(1),
  gcContentWindow: z.number().int().min(1),
  avoidRestrictionSites: z.array(z.string()),
  avoidSequences: z.string(),
  avoidRepeatLength: z.number().int().min(6),
  avoidPolyT: z.number().int().min(0),
  avoidPolyA: z.number().int().min(0),
  avoidPolyC: z.number().int().min(0),
  avoidPolyG: z.number().int().min(0),
  hairpinStemSize: z.number().int().min(0),
  hairpinWindow: z.number().int().min(0),
});

export type OptimizationRequest = z.infer<typeof OptimizationRequest>;

export const OptimizationResponse = z.object({
  output: z.object({
    nucleic_acid_sequence: z.string().nonempty(),
  }),
  debug: z.object({
    constraints: z.string().nonempty(),
    objectives: z.string().nonempty(),
    timeSeconds: z.number(),
  }),
});

export type OptimizationResponse = z.infer<typeof OptimizationResponse>;

export const AnalyzeResponse = z.object({
  aRatio: z.number(),
  cRatio: z.number(),
  gRatio: z.number(),
  tRatio: z.number(),
  atRatio: z.number(),
  gaRatio: z.number(),
  gcRatio: z.number(),
  uridineDepletion: z.number().nullable(),
  codonAdaptationIndex: z.number().nullable(),
  minimumFreeEnergy: z.object({
    structure: z.string().nonempty(),
    energy: z.number(),
  }),
  debug: z.object({
    timeSeconds: z.number(),
  }),
});

export type AnalyzeResponse = z.infer<typeof AnalyzeResponse>;
