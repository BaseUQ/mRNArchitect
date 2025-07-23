import {
  Alert,
  Button,
  Group,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { DownloadSimpleIcon, QuestionIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type {
  AnalyzeResponse,
  Constraint,
  Objective,
  OptimizationResponse,
} from "~/types/optimize";
import type { Sequence } from "~/types/sequence";

export interface OptimizationResultsProps {
  sequence: Sequence;
  constraints: Constraint[];
  objectives: Objective[];
  results: {
    input: {
      cdsAnalysis: AnalyzeResponse;
      fivePrimeUTRAnalysis: AnalyzeResponse | null;
      threePrimeUTRAnalysis: AnalyzeResponse | null;
      fullSequenceAnalysis: AnalyzeResponse;
    };
    outputs: {
      optimization: OptimizationResponse;
      cdsAnalysis: AnalyzeResponse;
      fullSequenceAnalysis: AnalyzeResponse;
    }[];
  };
}

export const OptimizationResults = ({
  sequence,
  constraints,
  results,
}: OptimizationResultsProps) => {
  const [showHelp, setShowHelp] = useState<boolean>(false);

  const generateRow = (
    title: string,
    getter: (
      data:
        | OptimizationResultsProps["results"]["input"]
        | OptimizationResultsProps["results"]["outputs"][0],
    ) => number | string,
  ) => {
    return [
      title,
      getter(results.input),
      ...results.outputs.map((output) => getter(output)),
    ];
  };

  const body = [
    generateRow("A ratio", (v) => v.cdsAnalysis.aRatio.toFixed(2)),
    generateRow("T/U ratio", (v) => v.cdsAnalysis.tRatio.toFixed(2)),
    generateRow("G ratio", (v) => v.cdsAnalysis.gRatio.toFixed(2)),
    generateRow("C ratio", (v) => v.cdsAnalysis.cRatio.toFixed(2)),
    generateRow("AT ratio", (v) => v.cdsAnalysis.atRatio.toFixed(2)),
    generateRow("GA ratio", (v) => v.cdsAnalysis.gaRatio.toFixed(2)),
    generateRow("GC ratio", (v) => v.cdsAnalysis.gcRatio.toFixed(2)),
    generateRow(
      "Uridine depletion",
      (v) => v.cdsAnalysis.uridineDepletion?.toFixed(2) ?? "-",
    ),
    generateRow(
      "CAI",
      (v) => v.cdsAnalysis.codonAdaptationIndex?.toFixed(2) ?? "-",
    ),
    generateRow("CDS MFE (kcal/mol)", (v) =>
      v.cdsAnalysis.minimumFreeEnergy.energy.toFixed(2),
    ),
    generateRow(
      "5' UTR MFE (kcal/mol)",
      () =>
        results.input.fivePrimeUTRAnalysis?.minimumFreeEnergy.energy.toFixed(
          2,
        ) ?? "-",
    ),
    generateRow(
      "3' UTR MFE (kcal/mol)",
      () =>
        results.input.threePrimeUTRAnalysis?.minimumFreeEnergy.energy.toFixed(
          2,
        ) ?? "-",
    ),
    generateRow("Total MFE (kcal/mol)", (v) =>
      v.fullSequenceAnalysis.minimumFreeEnergy.energy.toFixed(2),
    ),
  ];

  const inputReport = [
    "---mRNArchitect",
    "Version\t0.1",
    `Date\t${new Date().toISOString()}`,
    "",
    "---Input Sequence",
    `CDS\t\t${sequence.codingSequence}`,
    `5' UTR\t\t${sequence.fivePrimeUTR}`,
    `3' UTR\t\t${sequence.threePrimeUTR}`,
    `Poly(A) tail\t${sequence.polyATail}`,
  ];

  const constraintReports = constraints
    .map((c, index) => [
      `---Constraint #${index + 1}`,
      `Enable uridine depletion\t${c.enableUridineDepletion}`,
      `Avoid ribosome slip\t\t${c.avoidRibosomeSlip}`,
      `GC content minimum\t\t${c.gcContentMin}`,
      `GC content maximum\t\t${c.gcContentMax}`,
      `GC content window\t\t${c.gcContentWindow}`,
      `Avoid cut sites\t\t\t${c.avoidRestrictionSites}`,
      `Avoid sequences\t\t\t${c.avoidSequences}`,
      `Avoid poly(U)\t\t\t${c.avoidPolyT}`,
      `Avoid poly(A)\t\t\t${c.avoidPolyA}`,
      `Avoid poly(C)\t\t\t${c.avoidPolyC}`,
      `Avoid poly(G}\t\t\t${c.avoidPolyG}`,
      `Hairpin stem size\t\t${c.hairpinStemSize}`,
      `Hairpin window\t\t\t${c.hairpinWindow}`,
    ])
    .reduce((prev, current) => prev.concat([""], current), []);

  const outputReports = results.outputs.map(
    ({ optimization, cdsAnalysis, fullSequenceAnalysis }, index) => [
      `---Optimized Sequence #${index + 1}`,
      "",
      `CDS:\t\t\t${optimization.output.nucleic_acid_sequence}`,
      "",
      `Full-length mRNA:\t${sequence.fivePrimeUTR + optimization.output.nucleic_acid_sequence + sequence.threePrimeUTR + sequence.polyATail}`,
      "",
      "---Results",
      "Metric\t\t\tInput\tOptimized",
      `A ratio\t\t\t${results.input.cdsAnalysis.aRatio.toFixed(2)}\t${cdsAnalysis.aRatio.toFixed(2)}`,
      `T/U ratio\t\t${results.input.cdsAnalysis.tRatio.toFixed(2)}\t${cdsAnalysis.tRatio.toFixed(2)}`,
      `G ratio\t\t\t${results.input.cdsAnalysis.gRatio.toFixed(2)}\t${cdsAnalysis.gRatio.toFixed(2)}`,
      `C ratio\t\t\t${results.input.cdsAnalysis.cRatio.toFixed(2)}\t${cdsAnalysis.cRatio.toFixed(2)}`,
      `AT ratio\t\t${results.input.cdsAnalysis.atRatio.toFixed(2)}\t${cdsAnalysis.atRatio.toFixed(2)}`,
      `GA ratio\t\t${results.input.cdsAnalysis.gaRatio.toFixed(2)}\t${cdsAnalysis.gaRatio.toFixed(2)}`,
      `GC ratio\t\t${results.input.cdsAnalysis.gcRatio.toFixed(2)}\t${cdsAnalysis.gcRatio.toFixed(2)}`,
      `Uridine depletion\t${results.input.cdsAnalysis.uridineDepletion?.toFixed(2) ?? "-"}\t${cdsAnalysis.uridineDepletion?.toFixed(2) ?? "-"}`,
      `CAI\t\t\t${results.input.cdsAnalysis.codonAdaptationIndex?.toFixed(2) ?? "-"}\t${cdsAnalysis.codonAdaptationIndex?.toFixed(2) ?? "-"}`,
      `CDS MFE (kcal/mol)\t${results.input.cdsAnalysis.minimumFreeEnergy.energy.toFixed(2)}\t${cdsAnalysis.minimumFreeEnergy.energy.toFixed(2)}`,
      `5' UTR MFE (kcal/mol)\t${results.input.fivePrimeUTRAnalysis?.minimumFreeEnergy.energy.toFixed(2) ?? "-"}\t${results.input.fivePrimeUTRAnalysis?.minimumFreeEnergy.energy.toFixed(2) ?? "-"}`,
      `3' UTR MFE (kcal/mol)\t${results.input.threePrimeUTRAnalysis?.minimumFreeEnergy.energy.toFixed(2) ?? "-"}\t${results.input.threePrimeUTRAnalysis?.minimumFreeEnergy.energy.toFixed(2) ?? "-"}`,
      `Total MFE (kcal/mol)\t${results.input.fullSequenceAnalysis?.minimumFreeEnergy.energy.toFixed(2) ?? "-"}\t${fullSequenceAnalysis?.minimumFreeEnergy.energy.toFixed(2) ?? "-"}`,
    ],
  );

  const reportText = [
    ...inputReport,
    "",
    ...constraintReports,
    "",
    ...outputReports.reduce(
      (accumulator, current) => accumulator.concat([""], current),
      [],
    ),
    "",
  ].join("\n");

  return (
    <Stack>
      <Group justify="end">
        <Group>
          <Button
            component="a"
            href={URL.createObjectURL(
              new Blob([reportText], { type: "text/plain" }),
            )}
            download={`mRNAchitect-report-${new Date().toISOString()}.txt`}
            leftSection={<DownloadSimpleIcon />}
          >
            Download report (.txt format)
          </Button>
          <Switch
            label="Show help"
            checked={showHelp}
            onClick={() => setShowHelp(!showHelp)}
          />
        </Group>
      </Group>
      {showHelp && (
        <Alert title="Help" variant="light" icon={<QuestionIcon />}>
          <Table
            data={{
              body: [
                [
                  "Full-length mRNA",
                  "The output mRNA sequence(s) that have been assembled and optimized according to the specified optimisation parameters.",
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
          <Title order={6} pt="sm">
            References
          </Title>

          <ol>
            <li>
              Zulkower, V., & Rosser, S. (2020). DNA Chisel, a versatile
              sequence optimizer. Bioinformatics, 36(16), 4508-4509.
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
          </ol>
        </Alert>
      )}
      <Table
        highlightOnHover
        striped
        data={{
          caption: "Summary of generated sequences.",
          head: [
            "",
            "Input",
            ...results.outputs.map((_, index) => `Output ${index + 1}`),
          ],
          body,
        }}
      />
      <Tabs defaultValue={"0"}>
        <Tabs.List>
          {results.outputs.map((output, index) => (
            <Tabs.Tab
              key={`${index}-${output.optimization.output}`}
              value={index.toString()}
            >{`Output ${index + 1}`}</Tabs.Tab>
          ))}
        </Tabs.List>
        {results.outputs.map((output, index) => (
          <Tabs.Panel
            key={`${index}-${output.optimization.output}`}
            value={index.toString()}
          >
            <Text ff="monospace" p="md" style={{ wordBreak: "break-all" }}>
              <Tooltip label="5' UTR">
                <Text component="span" c="green">
                  {sequence.fivePrimeUTR}
                </Text>
              </Tooltip>
              <Tooltip label="Coding sequence">
                <Text component="span">
                  {output.optimization.output.nucleic_acid_sequence}
                </Text>
              </Tooltip>
              <Tooltip label="3' UTR">
                <Text component="span" c="green">
                  {sequence.threePrimeUTR}
                </Text>
              </Tooltip>
              <Tooltip label="Poly(A) tail">
                <Text component="span" c="blue">
                  {sequence.polyATail}
                </Text>
              </Tooltip>
            </Text>
          </Tabs.Panel>
        ))}
      </Tabs>
    </Stack>
  );
};
