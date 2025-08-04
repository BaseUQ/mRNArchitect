import z from "zod/v4";
import { Sequence } from "~/types/sequence";
import { convertSequenceToNucleicAcid } from "~/server/optimize";

const NucleicAcidSequence = Sequence.extend({
  codingSequenceType: z.literal("nucleic-acid"),
});

type NucleicAcidSequence = z.infer<typeof NucleicAcidSequence>;

export const asNucleicAcid = async (
  sequence: Sequence,
  organism: string = "human",
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
