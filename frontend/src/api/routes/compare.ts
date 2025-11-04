import z from "zod/v4";

export const CompareRequest = z.object({
  sequence_a: z.string().nonempty(),
  sequence_b: z.string().nonempty(),
});

export type CompareRequest = z.infer<typeof CompareRequest>;

export const CompareResponse = z.object({
  hamming_distance: z.int().nullable(),
});

export type CompareResponse = z.infer<typeof CompareResponse>;
