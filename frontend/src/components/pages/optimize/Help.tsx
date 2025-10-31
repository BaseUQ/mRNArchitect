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
                <Fragment key="coding-sequence">
                  Add your coding sequence of interest here, for sequence
                  optimisation<sup>1</sup>. You can paste either the amino acid,
                  RNA or DNA sequence. You may also want to consider adding
                  useful sequence elements such as nuclear localization signals,
                  signal peptides, or other tags. Ensure your coding sequence
                  starts with a MET codon and ends with a STOP codon. You may
                  want to use two different stop codons for efficient
                  termination (e.g., UAG/UGA).
                </Fragment>,
              ],
              [
                "5' UTR",
                <Fragment key="five-prime-utr">
                  Paste your 5′ untranslated region (UTR) sequence here. The 5′
                  UTR is scanned by the ribosome prior to translation initiation
                  and plays a key role in determining translation efficiency. We
                  provide a well-validated 5' UTRs option, the human
                  alpha-globin (ENSG00000206172) 5’ UTR sequence that has been
                  validated in different cell types and applications. We provide
                  further 5’ UTRs from housekeeping genes including beta globin
                  (ENSG00000244734), beta actin (ENSG00000075624) and albumin
                  (ENSG00000163631)<sup>2</sup>, a minimal 5' UTR<sup>3</sup>{" "}
                  and a 5’ UTR with low secondary structure, NELL2
                  (ENSG00000184613)<sup>4</sup>. By default, no 5' UTR is added.
                </Fragment>,
              ],
              [
                "3' UTR",
                <Fragment key="three-prime-utr">
                  Paste your 3' untranslated sequence here. The 3' untranslated
                  region (UTR) is regulated by microRNAs and RNA-binding
                  proteins and plays a key role in cell-specific mRNA stability
                  and expression. We provide a well-validated option, the human
                  alpha-globin (ENSG00000206172) 3' UTR sequence that has been
                  validated in different cell types and applications.
                  Additionally, we provide a human alpha-globin 3’ UTR with an
                  added microRNA 122 binding site, which was shown to reduce
                  mRNA expression in Huh7 (liver) cells<sup>5</sup>. By default,
                  no 3' UTR will be added.
                </Fragment>,
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
                "Simple/Advanced",
                "Simple mode applies a single set of optimisation criteria to the entire coding sequence. Advanced mode allows you to specify sub-regions (using nucleotide coordinates, see below) within the coding sequence that can be optimised using different criteria.",
              ],
              [
                "Nucleotide coordinates",
                <Fragment key="nucleotide-coordinates">
                  The coordinates within the coding region to optimise. Note
                  that the coordinates are 1-based, and are inclusive of the end
                  coordinate. Selecting "Full sequence" will optimise the whole
                  sequence.
                </Fragment>,
              ],
              [
                "Don't optimise region",
                "If set, the given sub-region is not optimised. That is, the input and output sequences will be exactly the same between the specified nucleotide coordinates.",
              ],
              [
                "Enable uridine depletion",
                "If selected, this minimizes the use of uridine nucleosides in the mRNA sequence. This is achieved by avoiding codons that encode uridine at the third wobble position and can impact the reactogenicity of the mRNA sequence.",
              ],
              [
                "Avoid ribosome slip",
                <Fragment key="avoid-ribosome-slip">
                  Avoid more than 3 consecutive Us in the open-reading frame,
                  where ribosomes can +1 frameshift at consecutive
                  N1-methylpseudouridines<sup>6</sup>.
                </Fragment>,
              ],
              [
                "Avoid manufacture restriction sites",
                <Fragment key="avoid-manufacture-restriction-sites">
                  Avoid restriction enzyme binding sites that can interfere with
                  DNA template synthesis.
                </Fragment>,
              ],
              [
                "Avoid microRNA seed sites",
                <Fragment key="avoid-micro-rna-seed-sites">
                  Avoid binding sites for microRNA seed sequences that can
                  result in unwanted degradation.
                </Fragment>,
              ],
              [
                "GC content",
                <Fragment key="gc-content">
                  Defines the minimum or maximum fraction of the mRNA sequence
                  comprising G/C nucleotides that is associated with stability
                  and hairpins of the mRNA. We recommend 0.4 and 0.7.
                </Fragment>,
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
                "The paired nucleotide composition of the input and output mRNA sequences. High GC content is associated with the formation of stable secondary structures.",
              ],
              [
                "Uridine depletion",
                "The fraction of codons with Uridine in the third nucleotide position. Maximum and minimum values are 1 (all) and 0 (no) codons with uridine in third nucleotide position.",
              ],
              [
                "CAI",
                <Fragment key="cai">
                  The Codon Adaptation Index (CAI) is a measure of deviation
                  between the codon usage of an mRNA sequence from the preferred
                  codon usage of the organism<sup>7</sup>. The CAI score ranges
                  from 0 (totally dissimilar) to 1 (all mRNA codons match the
                  organism's codon usage reference table).
                </Fragment>,
              ],
              [
                "CDS MFE",
                <Fragment key="cds-mfe">
                  The Minimum Free Energy (MFE) is the lowest Gibbs free energy
                  change associated with the formation of secondary structures
                  in RNA molecules due to intramolecular base pairing
                  <sup>8</sup>. Lower values of MFE are associated with the
                  formation of stable secondary structures and hairpins that can
                  occlude protein expression.
                </Fragment>,
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
            Zulkower, V. & Rosser, S. DNA Chisel, a versatile sequence
            optimizer. <i>Bioinformatics</i> <strong>36</strong>, 4508-4509
            (2020).
          </li>
          <li>
            Ma, Q. et al. Optimization of the 5ʹ untranslated region of mRNA
            vaccines. <i>Scientific Reports</i> <strong>14</strong>: 19845
            (2024).
          </li>
          <li>
            Trepotec, Z. et al. Maximizing the translational yield of mRNA
            therapeutics by minimizing 5′-UTRs. <i>Tissue Engineering Part A</i>{" "}
            <strong>25</strong>, 69-79 (2019).
          </li>
          <li>
            Lewis, C. et al. Quantitative profiling of human translation
            initiation reveals elements that potently regulate endogenous and
            therapeutically modified mRNAs. <i>Molecular Cell</i>{" "}
            <strong>85</strong>, 445-459 (2025).
          </li>
          <li>
            Jain R. et al. MicroRNAs enable mRNA therapeutics to selectively
            program cancer cells to self-destruct. <i>Nucleic Acid Therapies</i>{" "}
            <strong>28</strong>, 285-296 (2018).
          </li>
          <li>
            Mulroney, T. E. et al. N 1-methylpseudouridylation of mRNA causes+ 1
            ribosomal frameshifting. <i>Nature</i> <strong>625</strong>, 189-194
            (2024).
          </li>
          <li>
            Sharp, P. M. & Li, W.-H. The codon adaptation index-a measure of
            directional synonymous codon usage bias, and its potential
            applications. <i>Nucleic acids research</i> <strong>15</strong>,
            1281-1295 (1987).
          </li>
          <li>
            Lorenz, R. et al. ViennaRNA Package 2.0.{" "}
            <i>Algorithms for molecular biology</i> <strong>6</strong>, 26
            (2011).
          </li>
        </Text>
      </Stack>
    </Stack>
  );
};
