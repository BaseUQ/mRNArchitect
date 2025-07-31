import { Stack, Table, Text, Title } from "@mantine/core";
import { Fragment } from "react/jsx-runtime";

export const Help = () => {
  return (
    <Stack gap="xl">
      <Stack>
        <Title order={4}>Contact</Title>
        <Table
          data={{
            body: [
              [
                "Email",
                <a key="email-link" href="mailto:basedesign@uq.edu.au">
                  basedesign@uq.edu.au
                </a>,
              ],
              [
                "GitHub",
                <a
                  key="github-link"
                  href="https://github.com/BaseUQ/mRNArchitect"
                >
                  https://github.com/BaseUQ/mRNArchitect
                </a>,
              ],
              [
                "Example",
                <Fragment key="example">
                  For guidance on how to design an mRNA, please see the
                  step-by-step example{" "}
                  <a href="https://basefacility.org.au/wp-content/uploads/2024/12/mRNArchitect_Example.pdf">
                    here
                  </a>
                  .
                </Fragment>,
              ],
              [
                "Sequences",
                <Fragment key="sequences">
                  Please find useful sequences (promoters, UTRs etc.){" "}
                  <a href="https://basefacility.org.au/wp-content/uploads/2024/08/mRNArchitect_ExampleSequences.txt">
                    here
                  </a>
                  .
                </Fragment>,
              ],
            ],
          }}
        />
      </Stack>
      <Stack>
        <Title order={4}>Input sequence</Title>
        <Table
          data={{
            body: [
              [
                "Coding sequence",
                "Add your coding sequence of interest here. You can paste either the amino acid, RNA or DNA sequence. You may also want to consider adding useful sequence elements such as nuclear localization signals, signal peptides, or other tags. Ensure your coding sequence starts with a MET codon and ends with a STOP codon. You may want to use two different stop codons for efficient termination (e.g., UAG/UGA).",
              ],
              [
                "5' UTR",
                "Paste your 5' untranslated sequence here. The 5' untranslated region (UTR) is bound and scanned by the ribosome and is needed for translation. We provide a well-validated option, the human alpha-globin (HBA1; Gene ID 3039) 5' UTR sequence that has been validated in different cell types and applications. By default, no 5' UTR will be added.",
              ],
              [
                "3' UTR",
                "Paste your 3' untranslated sequence here. The 3' untranslated region (UTR) is regulated by microRNAs and RNA-binding proteins and plays a key role in cell-specific mRNA stability and expression. We provide a well-validated option, the human alpha-globin (HBA1; Gene ID 3039) 3' UTR sequence that has been validated in different cell types and applications. By default, no 3' UTR will be added.",
              ],
              [
                "Poly(A) tail",
                "Specify the length of the poly(A) tail or alternatively paste more complex designs. The length of the poly(A) tail plays a critical role in mRNA translation and stability. By default, no poly(A) tail will be added.",
              ],
            ],
          }}
        />
      </Stack>
      <Stack>
        <Title order={4}>Input optimisation parameter region</Title>
        <Table
          data={{
            body: [
              [
                "Nucleotide coordinates",
                'The coordinates within the coding region to which the constraints will be applied. Note that the coordinates are 1-based, and are inclusive of the end coordinate. Selecting "Full sequence" will apply constraints to the whole sequence.',
              ],
              [
                "Enable uridine depletion",
                "If selected, this minimizes the use of uridine nucleosides in the mRNA sequence. This is achieved by avoiding codons that encode uridine at the third wobble position and can impact the reactogenicity of the mRNA sequence.",
              ],
              [
                "Avoid ribosome slip",
                "Avoid more than 3 consecutive Us in the open-reading frame, where ribosomes can +1 frameshift at consecutive N1-methylpseudouridines (2).",
              ],
              [
                "GC content",
                "Avoid more than 3 consecutive Us in the open-reading frame, where ribosomes can +1 frameshift at consecutive N1-methylpseudouridines (2).",
              ],
              [
                "Avoid cut sites",
                "Specify restriction enzyme sites that should be avoided in the mRNA sequence.",
              ],
              [
                "Avoid sequences",
                "Specify sequences that should be avoided in the mRNA sequence.",
              ],
              [
                "Avoid homopolymer tracts",
                "Avoid homopolymer tracts that can be difficult to synthesise and translate. We recommend 9 for poly(U)/poly(A) and 6 for poly(C)/poly(G).",
              ],
              [
                "Avoid hairpins",
                "Avoid stable hairpins longer than the given length within the given window size. We recommend a length of 10 and window size of 60.",
              ],
            ],
          }}
        />
      </Stack>
      <Stack>
        <Title order={4}>Output</Title>
        <Table
          data={{
            body: [
              [
                "Full-length mRNA",
                "The output mRNA sequence(s) that have been assembled and optimised according to the specified optimisation parameters.",
              ],
              [
                "A/U/G/C ratio",
                "The nucleotide composition of the input and output optimised mRNA sequences. High GC content is associated with the formation of stable secondary structures, and lower U content is associated with low reactogenicity.",
              ],
              [
                "AT/GA/GC ratio",
                "The dinucleotide composition of the input and output mRNA sequences. High GC content is associated with the formation of stable secondary structures.",
              ],
              [
                "Uridine depletion",
                "The fraction of codons with Uridine in the third nucleotide position. Maximum and minimum values are 1 (all) and 0 (no) codons with uridine in third nucleotide position.",
              ],
              [
                "CAI",
                "The Codon Adaptation Index (CAI) is a measure of deviation between the codon usage of an mRNA sequence from the preferred codon usage of the organism (3). The CAI score ranges from 0 (totally dissimilar) to 1 (all mRNA codons match the organism's codon usage reference table).",
              ],
              [
                "CDS MFE",
                "The Minimum Free Energy (MFE) is the lowest Gibbs free energy change associated with the formation of secondary structures in RNA molecules due to intramolecular base pairing (4). Lower values of MFE are associated with the formation of stable secondary structures and hairpins that can occlude protein expression.",
              ],
              [
                "5' UTR MFE",
                "The Minimum Free Energy of the 5' UTR sequence. Lower values of MFE are associated with the formation of stable secondary structures.",
              ],
              [
                "3' UTR MFE",
                "The Minimum Free Energy of the 3' UTR sequences. Lower values of MFE are associated with the formation of stable secondary structures.",
              ],
              [
                "Total MFE",
                "The Minimum Free Energy of the full sequence (5' UTR, coding sequence, 3' UTR and poly(A) tail). Lower values of MFE are associated with the formation of stable secondary structures.",
              ],
            ],
          }}
        />
      </Stack>
      <Stack>
        <Title order={4}>References</Title>
        <Text component="ol" size="sm" pl="xl">
          <li>
            Zulkower, V., & Rosser, S. (2020). DNA Chisel, a versatile sequence
            optimizer. Bioinformatics, 36(16), 4508-4509.
          </li>
          <li>
            Mulroney, T.E., Pöyry, T., Yam-Puc, J.C. et al. (2024).
            N1-methylpseudouridylation of mRNA causes +1 ribosomal
            frameshifting. Nature 625, 189–194.
          </li>
          <li>
            Sharp, P. M., & Li, W. H. (1987). The Codon Adaptation Index—a
            measure of directional synonymous codon usage bias, and its
            potential applications. Nucleic Acids Research 15(3), 1281-1295.
          </li>
          <li>
            Lorenz, R., Bernhart, S. H., Höner Zu Siederdissen, C., Tafer, H.,
            Flamm, C., Stadler, P. F., & Hofacker, I. L. (2011). ViennaRNA
            Package 2.0. Algorithms for Molecular Biology, 6:26.
          </li>
        </Text>
      </Stack>
    </Stack>
  );
};
