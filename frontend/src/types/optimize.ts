import z from "zod/v4";
import { sanitizeNucleicAcidSequence } from "./util";

const REQUIRED_MESSAGE = "Field cannot be empty.";

export const OptimizationParameter = z
  .object({
    start_coordinate: z.int(REQUIRED_MESSAGE).min(1).nullable(),
    end_coordinate: z.int(REQUIRED_MESSAGE).min(1).nullable(),
    enforce_sequence: z.boolean(),
    codon_usage_table: z.string(),
    optimize_cai: z.boolean(),
    optimize_tai: z.number().nullable(),
    avoid_repeat_length: z.int(REQUIRED_MESSAGE).min(0),
    enable_uridine_depletion: z.boolean(),
    avoid_ribosome_slip: z.boolean(),
    avoid_manufacture_restriction_sites: z.boolean(),
    avoid_micro_rna_seed_sites: z.boolean(),
    gc_content_min: z.number().min(0).max(1),
    gc_content_max: z.number().min(0).max(1),
    gc_content_window: z.int(REQUIRED_MESSAGE).min(1),
    avoid_restriction_sites: z.array(z.string()),
    avoid_sequences: z.array(
      z
        .string()
        .regex(/[ACGTU]/gim, "Sequences must be nucleic acids.")
        .transform(sanitizeNucleicAcidSequence),
    ),
    avoid_poly_t: z.int(REQUIRED_MESSAGE).min(0),
    avoid_poly_a: z.int(REQUIRED_MESSAGE).min(0),
    avoid_poly_c: z.int(REQUIRED_MESSAGE).min(0),
    avoid_poly_g: z.int(REQUIRED_MESSAGE).min(0),
    hairpin_stem_size: z.int(REQUIRED_MESSAGE).min(0),
    hairpin_window: z.int(REQUIRED_MESSAGE).min(0),
  })
  .check((ctx) => {
    const { start_coordinate, end_coordinate } = ctx.value;
    if (start_coordinate !== null && end_coordinate !== null) {
      if (start_coordinate > end_coordinate) {
        ctx.issues.push({
          code: "custom",
          message:
            "Start coordinate must be less than or equal to end coordinate.",
          input: ctx.value,
          path: ["start_coordinate"],
        });
      }
      if ((start_coordinate - 1) % 3 !== 0) {
        ctx.issues.push({
          code: "custom",
          message:
            "Start coordinate must align to the start of a codon frame (e.g. 1, 4, 7, etc).",
          input: ctx.value,
          path: ["start_coordinate"],
        });
      }
      if (end_coordinate % 3 !== 0) {
        ctx.issues.push({
          code: "custom",
          message:
            "End coordinate must align to the end of a codon frame (e.g. 3, 6, 9, etc).",
          input: ctx.value,
          path: ["end_coordinate"],
        });
      }
    } else if (start_coordinate === null && end_coordinate !== null) {
      ctx.issues.push({
        code: "custom",
        message: "Start coordinate must be set.",
        input: ctx.value,
        path: ["start_coordinate"],
      });
    } else if (start_coordinate !== null && end_coordinate === null) {
      ctx.issues.push({
        code: "custom",
        message: "End coordinate must be set.",
        input: ctx.value,
        path: ["end_coordinate"],
      });
    }
  });

export type OptimizationParameter = z.infer<typeof OptimizationParameter>;

export const OptimizationResult = z.object({
  success: z.literal(true),
  result: z.object({
    sequence: z.object({
      nucleic_acid_sequence: z.string().nonempty(),
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
  a_ratio: z.number(),
  c_ratio: z.number(),
  g_ratio: z.number(),
  t_ratio: z.number(),
  at_ratio: z.number(),
  ga_ratio: z.number(),
  gc_ratio: z.number(),
  uridine_depletion: z.number().nullable(),
  codon_adaptation_index: z.number().nullable(),
  trna_adaptation_index: z.number().nullable(),
  minimum_free_energy: z.object({
    structure: z.string().nonempty(),
    energy: z.number(),
  }),
  debug: z.object({
    time_seconds: z.number(),
  }),
});

export type Analysis = z.infer<typeof Analysis>;
