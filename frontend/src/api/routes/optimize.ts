import z from "zod/v4";
import { Organism } from "../types";
import { apiUrl, sanitizeNucleicAcidSequence } from "../utils";

const REQUIRED_MESSAGE = "Field cannot be empty.";

export const OptimizationParameter = z
  .object({
    start_coordinate: z.int(REQUIRED_MESSAGE).min(1).nullable(),
    end_coordinate: z.int(REQUIRED_MESSAGE).min(1).nullable(),
    enforce_sequence: z.boolean(),
    organism: Organism,
    optimize_cai: z.boolean(),
    optimize_tai: z.number().nullable(),
    avoid_repeat_length: z.int(REQUIRED_MESSAGE).min(0),
    enable_uridine_depletion: z.boolean(),
    avoid_ribosome_slip: z.boolean(),
    avoid_manufacture_restriction_sites: z.boolean(),
    avoid_micro_rna_seed_sites: z.boolean(),
    gc_content_global_min: z.number().min(0).max(1),
    gc_content_global_max: z.number().min(0).max(1),
    gc_content_window_min: z.number().min(0).max(1),
    gc_content_window_max: z.number().min(0).max(1),
    gc_content_window_size: z.int(REQUIRED_MESSAGE).min(1),
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

export const OptimizationRequest = z.object({
  sequence: z.string().nonempty(),
  parameters: z.array(OptimizationParameter),
});

export type OptimizationRequest = z.infer<typeof OptimizationRequest>;

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

export const OptimizationResponse = z.union([
  OptimizationResult,
  OptimizationError,
]);

export type OptimizationResponse = z.infer<typeof OptimizationResponse>;

export const optimize = (data: OptimizationRequest) =>
  fetch(apiUrl("/api/optimize"), {
    method: "POST",
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((json) => OptimizationResponse.parse(json));
