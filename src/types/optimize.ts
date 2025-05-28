import z from "zod";

export const OptimizationRequest = z.object({
  sequenceType: z.union([z.literal("nucleic-acid"), z.literal("amino-acid")]),
  sequence: z.string().nonempty("Coding sequence is required."),
  fivePrimeUTR: z.string(),
  threePrimeUTR: z.string(),
  polyATail: z.string(),
  numberOfSequences: z.number().int().min(1).max(10),
  organism: z.union([z.literal("h_sapiens"), z.literal("m_musculus")]),
  avoidUridineDepletion: z.boolean(),
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
  input: z.string().nonempty(),
  output: z.string().nonempty(),
  debug: z.object({
    constraints: z.string().nonempty(),
    objectives: z.string().nonempty(),
    time: z.number(),
  }),
});

export type OptimizationResponse = z.infer<typeof OptimizationResponse>;

export const AnalyzeResponse = z.object({
  a_ratio: z.number(),
  c_ratio: z.number(),
  g_ratio: z.number(),
  t_ratio: z.number(),
  at_ratio: z.number(),
  ga_ratio: z.number(),
  gc_ratio: z.number(),
  uridine_depletion: z.number().nullable(),
  codon_adaptation_index: z.number().nullable(),
  minimum_free_energy: z.tuple([z.string().nonempty(), z.number()]),
  debug: z.object({
    time: z.number(),
  }),
});

export type AnalyzeResponse = z.infer<typeof AnalyzeResponse>;
