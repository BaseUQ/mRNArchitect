import z from "zod/v4";

export const OptimizationParameter = z
  .object({
    startCoordinate: z.int().min(1).nullable(),
    endCoordinate: z.int().min(1).nullable(),
    organism: z.string(),
    avoidRepeatLength: z.int().min(0),
    enableUridineDepletion: z.boolean(),
    avoidRibosomeSlip: z.boolean(),
    gcContentMin: z.number().min(0).max(1),
    gcContentMax: z.number().min(0).max(1),
    gcContentWindow: z.int().min(1),
    avoidRestrictionSites: z.array(z.string()),
    avoidSequences: z.array(
      z.string().regex(/[ACGTU]/gim, "Sequences must be nucleic acids."),
    ),
    avoidPolyT: z.int().min(0),
    avoidPolyA: z.int().min(0),
    avoidPolyC: z.int().min(0),
    avoidPolyG: z.int().min(0),
    hairpinStemSize: z.int().min(0),
    hairpinWindow: z.int().min(0),
  })
  .check((ctx) => {
    if (
      ctx.value.startCoordinate !== null &&
      ctx.value.endCoordinate !== null &&
      ctx.value.startCoordinate > ctx.value.endCoordinate
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

export type OptimizationParameter = z.infer<typeof OptimizationParameter>;

export const OptimizationResult = z.object({
  success: z.literal(true),
  result: z.object({
    sequence: z.object({
      nucleicAcidSequence: z.string().nonempty(),
    }),
    constraints: z.string().nonempty(),
    objectives: z.string().nonempty(),
  }),
});

export type OptimizationResult = z.infer<typeof OptimizationResult>;

export const OptimizationError = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
    location: z.any(),
    constraint: z.any(),
  }),
});

export type OptimizationError = z.infer<typeof OptimizationError>;

export const Optimization = z.union([OptimizationResult, OptimizationError]);

export type Optimization = z.infer<typeof Optimization>;

export const Analysis = z.object({
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

export type Analysis = z.infer<typeof Analysis>;
