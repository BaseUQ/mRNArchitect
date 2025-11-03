import { expect, test } from "vitest";
import { sanitizeNucleicAcidSequence, sanitizeSequence } from "./utils";

test.each([
  ["aaaccc", "AAACCC"],
  ["   aaa\nccc\tuuu\n", "AAACCCUUU"],
])("sanitizeSequence(%s) -> %s", (input, expected) => {
  expect(sanitizeSequence(input)).toBe(expected);
});

test.each([
  ["aaacccuuu", "AAACCCTTT"],
  ["   aaa\nccc\tuuu\n", "AAACCCTTT"],
])("sanitizeNucleicAcidSequence(%s) -> %s", (input, expected) => {
  expect(sanitizeNucleicAcidSequence(input)).toBe(expected);
});
