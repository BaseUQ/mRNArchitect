import z from "zod";

export const OptimizationRequest = z.object({
  sequenceType: z.union([
    z.literal("nucleic-acid"),
    z.literal("amino-acid"),
  ]),
  sequence: z.string().nonempty("Coding sequence is required."),
  fivePrimeUTR: z.string().nonempty("5'UTR is required."),
  threePrimeUTR: z.string().nonempty("3'UTR is required."),
  polyATail: z.string(),
  numberOfSequences: z.number().int().min(1).max(10),
  organism: z.union([z.literal("h_sapiens"), z.literal("m_musculus")]),
  avoidUridineDepletion: z.boolean(),
  avoidRibosomeSlip: z.boolean(),
  minMaxGCContent: z.tuple([
    z.number().min(0).max(1),
    z.number().min(0).max(1),
  ]),
  gcContentWindow: z.number().int().min(1),
  avoidCutSites: z.array(z.string()),
  avoidSequences: z.string(),
  avoidRepeatLength: z.number().int().min(6).max(20),
  avoidPolyU: z.number().int().min(0),
  avoidPolyA: z.number().int().min(0),
  avoidPolyC: z.number().int().min(0),
  avoidPolyG: z.number().int().min(0),
  hairpinStemSize: z.number().int().min(0),
  hairpinWindow: z.number().int().min(0),
});

export type OptimizationRequest = z.infer<typeof OptimizationRequest>;


const SequenceAnalysis = z.object({
  sequence: z.string().nonempty(),
  amino: z.string().nonempty(),
  nucleic: z.string().nonempty(),
  cai: z.number(),
})

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
  tu_ratio: z.number(),
  uridine_depletion: z.number().nullable(),
  codon_adaptation_index: z.number().nullable(),
  minimum_free_energy: z.tuple([z.string().nonempty(), z.number()]),
});

export type AnalyzeResponse = z.infer<typeof AnalyzeResponse>;

