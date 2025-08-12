import { expect, test } from "@playwright/test";

const _EGFP_AMINO_ACID_SEQUENCE =
  "MVSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGKLPVPWPTLVTTLTYGVQCFSRYPDHMKQHDFFKSAMPEGYVQERTIFFKDDGNYKTRAEVKFEGDTLVNRIELKGIDFKEDGNILGHKLEYNYNSHNVYIMADKQKNGIKVNFKIRHNIEDGSVQLADHYQQNTPIGDGPVLLPDNHYLSTQSALSKDPNEKRDHMVLLEFVTAAGITLGMDELYK";
const EGFP_NUCLEIC_ACID_SEQUENCE =
  "ATGGTGAGCAAGGGCGAGGAGCTGTTCACCGGCGTGGTGCCCATCCTGGTGGAGCTGGACGGCGACGTGAACGGCCACAAGTTCAGCGTGAGCGGCGAGGGAGAGGGCGACGCCACCTATGGCAAGCTGACCCTGAAGTTCATCTGCACCACCGGCAAGCTGCCCGTGCCCTGGCCCACACTGGTGACCACCCTGACCTACGGCGTGCAGTGCTTCAGCAGATACCCCGACCACATGAAGCAGCACGATTTCTTCAAGAGCGCCATGCCCGAGGGCTACGTGCAGGAGAGAACCATCTTCTTCAAGGACGACGGCAACTACAAGACCAGAGCCGAGGTGAAGTTCGAGGGCGACACCCTGGTGAACAGAATCGAGCTGAAGGGCATCGACTTCAAGGAGGATGGCAACATCCTGGGCCACAAGCTGGAGTACAACTACAACAGCCACAACGTGTACATCATGGCCGACAAGCAGAAGAACGGCATCAAGGTGAACTTCAAGATCAGACACAACATCGAGGACGGCAGCGTGCAGCTGGCCGACCACTACCAGCAGAACACCCCCATCGGCGACGGCCCCGTGCTGCTGCCCGACAACCACTACCTGAGCACCCAGAGCGCCCTGAGCAAGGACCCCAACGAGAAGAGAGACCACATGGTGCTGCTGGAGTTCGTGACCGCCGCCGGCATCACCCTGGGCATGGACGAGCTGTACAAG";

//test("run optimization - eGFP amino acid", async ({ page }) => {
//  await page.goto("/");
//  await page.waitForTimeout(1_000); // brief wait for the form to load, should make this better
//  await page.getByRole("radio", { name: "Amino acid" }).dispatchEvent("click");
//  await page
//    .getByRole("textbox", { name: "Coding sequence textarea" })
//    .fill(EGFP_AMINO_ACID_SEQUENCE);
//  await page.getByRole("button", { name: "Optimise sequence" }).click();
//
//  await expect(page.getByRole("tab", { name: "Output" })).toHaveAttribute(
//    "aria-selected",
//    "true",
//    { timeout: 30_000 },
//  );
//  await expect(page.getByText(EGFP_NUCLEIC_ACID_SEQUENCE)).toHaveCount(1);
//});

//test("run optimization - eGFP amino acid (pre-fill example)", async ({
//  page,
//}) => {
//  await page.goto("/");
//  await page.waitForTimeout(1_000); // brief wait for the form to load, should make this better
//  await page
//    .getByRole("button", { name: "Pre-fill example sequence (eGFP)" })
//    .click();
//  await page.getByRole("button", { name: "Optimise sequence" }).click();
//
//  await expect(page.getByRole("tab", { name: "Output" })).toHaveAttribute(
//    "aria-selected",
//    "true",
//    { timeout: 30_000 },
//  );
//  await expect(page.getByText(EGFP_NUCLEIC_ACID_SEQUENCE)).toHaveCount(1);
//});

test("run optimization - eGFP nucleic acid", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1_000); // brief wait for the form to load, should make this better

  await page
    .getByRole("textbox", { name: "Coding sequence textarea" })
    .fill(EGFP_NUCLEIC_ACID_SEQUENCE);
  await page.getByRole("button", { name: "Optimise sequence" }).click();

  await expect(page.getByRole("tab", { name: "Output" })).toHaveAttribute(
    "aria-selected",
    "true",
    { timeout: 60_000 },
  );

  await expect(page.getByText(EGFP_NUCLEIC_ACID_SEQUENCE)).toHaveCount(2);
});
