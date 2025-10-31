import z from "zod/v4";
import {
  Analysis,
  Optimization,
  OptimizationParameter,
} from "~/types/optimize";

const API = import.meta.env.VITE_API ?? "";

const SequenceAndOrganism = z.object({
  sequence: z.string().nonempty(),
  organism: z.string().nonempty(),
});

type SequenceAndOrganism = z.infer<typeof SequenceAndOrganism>;

export const convert = (data: SequenceAndOrganism) =>
  fetch(`${API}/api/convert`, {
    method: "POST",
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((json) =>
      z
        .object({
          sequence: z.string().nonempty(),
        })
        .parse(json),
    );

const OptimizationRequest = z.object({
  sequence: z.string().nonempty(),
  parameters: z.array(OptimizationParameter),
});

type OptimizationRequest = z.infer<typeof OptimizationRequest>;

export const optimize = (data: OptimizationRequest) =>
  fetch(`${API}/api/optimize`, {
    method: "POST",
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((json) => Optimization.parse(json));

export const analyze = (data: SequenceAndOrganism) =>
  fetch(`${API}/api/analyze`, {
    method: "POST",
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((json) => Analysis.parse(json));
