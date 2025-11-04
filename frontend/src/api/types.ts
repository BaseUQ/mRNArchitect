import z from "zod/v4";

export const SequenceAndOrganism = z.object({
  sequence: z.string().nonempty(),
  organism: z.string().nonempty(),
});

export type SequenceAndOrganism = z.infer<typeof SequenceAndOrganism>;
