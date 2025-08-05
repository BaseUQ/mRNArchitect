import z from "zod/v4";
import { convertSequenceToNucleicAcid } from "~/server/optimize";
import { Sequence } from "~/types/sequence";

const NucleicAcidSequence = Sequence.extend({
  codingSequenceType: z.literal("nucleic-acid"),
});

type NucleicAcidSequence = z.infer<typeof NucleicAcidSequence>;

export const nucleotideCDSLength = (sequence: Sequence) =>
  sequence.codingSequence.length *
  (sequence.codingSequenceType === "nucleic-acid" ? 1 : 3);

export const asNucleicAcid = async (
  sequence: Sequence,
  organism = "human",
): Promise<NucleicAcidSequence> => {
  if (sequence.codingSequenceType === "nucleic-acid") {
    return NucleicAcidSequence.parse(sequence);
  }
  return {
    ...sequence,
    codingSequenceType: "nucleic-acid",
    codingSequence: await convertSequenceToNucleicAcid({
      data: { sequence: sequence.codingSequence, organism },
    }),
  };
};
