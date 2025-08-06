/**
 * Remove all whitespace/newlines and upper case the sequence.
 */
export const normalizeSequence = (v: string) =>
  v.replaceAll(/\s/gim, "").toUpperCase();

export const normalizeNucleicAcidSequence = (v: string) =>
  normalizeSequence(v).replaceAll("U", "T");
