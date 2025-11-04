import z from "zod/v4";
import type { SequenceAndOrganism } from "../types";
import { apiUrl } from "../utils";

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
  trna_adaptation_index: z.number().nullable(),
  minimum_free_energy: z.object({
    structure: z.string().nonempty(),
    energy: z.number(),
  }),
  debug: z.object({
    time_seconds: z.number(),
  }),
});

export type AnalyzeResponse = z.infer<typeof AnalyzeResponse>;

export const analyze = (data: SequenceAndOrganism) =>
  fetch(apiUrl("/api/analyze"), {
    method: "POST",
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((json) => AnalyzeResponse.parse(json));
