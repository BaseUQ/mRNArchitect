import z from "zod/v4";

const Location = z
  .object({
    start: z.number().int().nullable(),
    end: z.number().int().nullable(),
  })
  .check((ctx) => {
    if (
      ctx.value.start !== null &&
      ctx.value.end !== null &&
      ctx.value.start > ctx.value.end
    ) {
      ctx.issues.push({
        code: "custom",
        message:
          "Start coordinate must be less than or equal to end coordinate.",
        input: ctx.value,
        path: ["start"],
      });
    }
  });

export const Constraint = Location.extend({
  enableUridineDepletion: z.boolean(),
  avoidRibosomeSlip: z.boolean(),
  gcContentMin: z.number().min(0).max(1),
  gcContentMax: z.number().min(0).max(1),
  gcContentWindow: z.number().int().min(1),
  avoidRestrictionSites: z.array(z.string()),
  avoidSequences: z.array(
    z.string().regex(/[ACGTU]/gim, "Sequences must be nucleic acids."),
  ),
  avoidPolyT: z.number().int().min(0),
  avoidPolyA: z.number().int().min(0),
  avoidPolyC: z.number().int().min(0),
  avoidPolyG: z.number().int().min(0),
  hairpinStemSize: z.number().int().min(0),
  hairpinWindow: z.number().int().min(0),
}).check((ctx) => {
  const result = Location.safeParse(ctx.value);
  if (!result.success) {
    ctx.issues = [...ctx.issues, ...result.error.issues];
  }
});

export type Constraint = z.infer<typeof Constraint>;

export const Objective = Location.extend({
  organism: z.string(),
  avoidRepeatLength: z.number().int().min(6),
}).check((ctx) => {
  const result = Location.safeParse(ctx.value);
  if (!result.success) {
    ctx.issues = [...ctx.issues, ...result.error.issues];
  }
});

export type Objective = z.infer<typeof Objective>;

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
