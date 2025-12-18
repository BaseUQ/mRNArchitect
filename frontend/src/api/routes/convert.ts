import z from "zod/v4";
import type { SequenceAndOrganism } from "../types";
import { api } from "../utils";

export const ConvertResponse = z.object({
  sequence: z.string().nonempty(),
});

export type ConvertResponse = z.infer<typeof ConvertResponse>;

export const convert = (data: SequenceAndOrganism) =>
  api("/api/convert", {
    method: "POST",
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((json) => ConvertResponse.parse(json));
