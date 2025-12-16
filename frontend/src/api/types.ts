import z from "zod/v4";

export const Organism = z.object({
  slug: z.string(),
  name: z.string(),
  id: z.string(),
});

export type Organism = z.infer<typeof Organism>;

export const SequenceAndOrganism = z.object({
  sequence: z.string().nonempty(),
  organism: z.string().nonempty(),
});

export type SequenceAndOrganism = z.infer<typeof SequenceAndOrganism>;
