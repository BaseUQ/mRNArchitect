import z from "zod/v4";
import { normalizeSequence } from "./util";

export const Sequence = z
  .object({
    codingSequenceType: z.union([
      z.literal("nucleic-acid"),
      z.literal("amino-acid"),
    ]),
    codingSequence: z
      .string()
      .nonempty("Coding sequence must not be empty.")
      .transform(normalizeSequence),
    fivePrimeUtr: z.string().transform(normalizeSequence),
    threePrimeUtr: z.string().transform(normalizeSequence),
    polyATail: z.string().transform(normalizeSequence),
  })
  .check((ctx) => {
    if (ctx.value.codingSequenceType === "nucleic-acid") {
      if (ctx.value.codingSequence.length % 3 !== 0) {
        ctx.issues.push({
          code: "custom",
          message:
            "Nucleic acid sequence must be a valid amino acid (sequence length must be a multiple of 3).",
          input: ctx.value.codingSequence,
          path: ["codingSequence"],
          continue: true,
        });
      }
      if (ctx.value.codingSequence.search(/[^ACGTU]/gim) !== -1) {
        ctx.issues.push({
          code: "custom",
          message: "Nucleic acid must only contain the characters 'ACGTU'.",
          input: ctx.value.codingSequence,
          path: ["codingSequence"],
          continue: true,
        });
      }
    }

    if (ctx.value.codingSequenceType === "amino-acid") {
      if (
        ctx.value.codingSequence.search(/[^ARNDCEQGHILKMFPSTWYV*]/gim) !== -1
      ) {
        ctx.issues.push({
          code: "custom",
          message:
            "Amino acid must only contain the characters 'ARNDCEQGHILKMFPSTWYV*'.",
          input: ctx.value.codingSequence,
          path: ["codingSequence"],
        });
      }
    }
  });

export type Sequence = z.infer<typeof Sequence>;
