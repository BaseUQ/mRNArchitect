import { expect, test } from "@playwright/test";

const EGFP_NUCLEIC_ACID_SEQUENCE =
  "ATGGTGAGCAAGGGCGAGGAGCTGTTCACCGGCGTGGTGCCCATCCTGGTGGAGCTGGACGGCGACGTGAACGGCCACAAGTTCAGCGTGAGCGGCGAGGGAGAGGGCGACGCCACCTATGGCAAGCTGACCCTGAAGTTCATCTGCACCACCGGCAAGCTGCCCGTGCCCTGGCCCACACTGGTGACCACCCTGACCTACGGCGTGCAGTGCTTCAGCAGATACCCCGACCACATGAAGCAGCACGATTTCTTCAAGAGCGCCATGCCCGAGGGCTACGTGCAGGAGAGAACCATCTTCTTCAAGGACGACGGCAACTACAAGACCAGAGCCGAGGTGAAGTTCGAGGGCGACACCCTGGTGAACAGAATCGAGCTGAAGGGCATCGACTTCAAGGAGGATGGCAACATCCTGGGCCACAAGCTGGAGTACAACTACAACAGCCACAACGTGTACATCATGGCCGACAAGCAGAAGAACGGCATCAAGGTGAACTTCAAGATCAGACACAACATCGAGGACGGCAGCGTGCAGCTGGCCGACCACTACCAGCAGAACACCCCCATCGGCGACGGCCCCGTGCTGCTGCCCGACAACCACTACCTGAGCACCCAGAGCGCCCTGAGCAAGGACCCCAACGAGAAGAGAGACCACATGGTGCTGCTGGAGTTCGTGACCGCCGCCGGCATCACCCTGGGCATGGACGAGCTGTACAAG";

test("run optimization - eGFP nucleic acid", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1_000); // brief wait for the form to load, should make this better

  await page.getByRole("textbox", { name: "Email" }).fill("test@example.com");
  await page.getByRole("textbox", { name: "Name" }).fill("Test name");
  await page.getByRole("textbox", { name: "Organisation" }).fill("Test org");
  await page.getByRole("button", { name: "Continue", exact: false }).click();

  await page
    .getByRole("textbox", { name: "Coding sequence textarea" })
    .fill(EGFP_NUCLEIC_ACID_SEQUENCE);
  await page.getByLabel("Number of optimised sequences").fill("1");

  await page.getByRole("button", { name: "Optimise sequence" }).click();

  await expect(page.getByRole("tab", { name: "Output" })).toHaveAttribute(
    "aria-selected",
    "true",
    { timeout: 60_000 },
  );

  await expect(page.getByText(EGFP_NUCLEIC_ACID_SEQUENCE)).toHaveCount(2);
});
