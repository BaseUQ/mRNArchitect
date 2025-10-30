import z from "zod/v4";
import { convert } from "~/api";
import { Sequence } from "~/types/sequence";

const NucleicAcidSequence = Sequence.safeExtend({
  codingSequenceType: z.literal("nucleic-acid"),
});

type NucleicAcidSequence = z.infer<typeof NucleicAcidSequence>;

export const nucleotideCDSLength = (sequence: Sequence) =>
  sequence.codingSequence.length *
  (sequence.codingSequenceType === "nucleic-acid" ? 1 : 3);

export const asNucleicAcid = async (
  sequence: Sequence,
  organism = "homo-sapiens",
): Promise<NucleicAcidSequence> => {
  if (sequence.codingSequenceType === "nucleic-acid") {
    return NucleicAcidSequence.parse(sequence);
  }
  const result = await convert({ sequence: sequence.codingSequence, organism });
  return {
    ...sequence,
    codingSequenceType: "nucleic-acid",
    codingSequence: result.sequence,
  };
};
