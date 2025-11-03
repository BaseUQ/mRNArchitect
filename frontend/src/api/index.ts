import z from "zod/v4";
import {
  AnalyzeResponse,
  type OptimizationRequest,
  OptimizationResponse,
  type SequenceAndOrganism,
} from "./types";

const API = import.meta.env.VITE_API ?? "";

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

export const optimize = (data: OptimizationRequest) =>
  fetch(`${API}/api/optimize`, {
    method: "POST",
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((json) => OptimizationResponse.parse(json));

export const analyze = (data: SequenceAndOrganism) =>
  fetch(`${API}/api/analyze`, {
    method: "POST",
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((json) => AnalyzeResponse.parse(json));
