/**
 * Remove all whitespace/newlines and upper case the sequence.
 */
export const sanitizeSequence = (v: string) =>
  v.replaceAll(/\s/gim, "").toUpperCase();

/**
 * Remove all whitespace/newlines, upper case the sequence and convert 'U' to 'T'.
 */
export const sanitizeNucleicAcidSequence = (v: string) =>
  sanitizeSequence(v).replaceAll("U", "T");
