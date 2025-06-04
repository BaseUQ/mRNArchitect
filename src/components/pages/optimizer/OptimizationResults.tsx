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
import {
  CaretLeftIcon,
  DownloadSimpleIcon,
  QuestionIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import type {
  AnalyzeResponse,
  OptimizationRequest,
  OptimizationResponse,
} from "~/types/optimize";

interface OptimizationResults {
  input: OptimizationRequest;
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
  onClickBack: () => void;
}

export const OptimizationResults = ({
  input,
  onClickBack,
  results,
}: OptimizationResults) => {
  const [showHelp, setShowHelp] = useState<boolean>(false);

  const generateRow = (
    title: string,
    getter: (
      data:
        | OptimizationResults["results"]["input"]
        | OptimizationResults["results"]["outputs"][0],
    ) => number | string,
  ) => {
    return [
      title,
      getter(results.input),
      ...results.outputs.map((output) => getter(output)),
    ];
  };

  const body = [
    generateRow("A ratio", (v) => v.cdsAnalysis.a_ratio.toFixed(2)),
    generateRow("T/U ratio", (v) => v.cdsAnalysis.t_ratio.toFixed(2)),
    generateRow("G ratio", (v) => v.cdsAnalysis.g_ratio.toFixed(2)),
    generateRow("C ratio", (v) => v.cdsAnalysis.c_ratio.toFixed(2)),
    generateRow("AT ratio", (v) => v.cdsAnalysis.at_ratio.toFixed(2)),
    generateRow("GA ratio", (v) => v.cdsAnalysis.ga_ratio.toFixed(2)),
    generateRow("GC ratio", (v) => v.cdsAnalysis.gc_ratio.toFixed(2)),
    generateRow(
      "Uridine depletion",
      (v) => v.cdsAnalysis.uridine_depletion?.toFixed(2) ?? "-",
    ),
    generateRow(
      "CAI",
      (v) => v.cdsAnalysis.codon_adaptation_index?.toFixed(2) ?? "-",
    ),
    generateRow("CDS MFE (kcal/mol)", (v) =>
      v.cdsAnalysis.minimum_free_energy[1].toFixed(2),
    ),
    generateRow(
      "5' UTR MFE (kcal/mol)",
      (v) =>
        results.input.fivePrimeUTRAnalysis?.minimum_free_energy[1].toFixed(2) ??
        "-",
    ),
    generateRow(
      "3' UTR MFE (kcal/mol)",
      (v) =>
        results.input.threePrimeUTRAnalysis?.minimum_free_energy[1].toFixed(
          2,
        ) ?? "-",
    ),
    generateRow("Total MFE (kcal/mol)", (v) =>
      v.fullSequenceAnalysis.minimum_free_energy[1].toFixed(2),
    ),
  ];

  const inputReport = [
    "---mRNArchitect",
    "Version\t0.1",
    `Date\t${new Date().toISOString()}`,
    "",
    "---Input Sequence",
    `CDS\t\t${input.sequence}`,
    `5' UTR\t\t${input.fivePrimeUTR}`,
    `3' UTR\t\t${input.threePrimeUTR}`,
    `Poly(A) tail\t${input.polyATail}`,
    "",
    "---Parameters",
    `Number of sequences\t\t${input.numberOfSequences}`,
    `Organism\t\t\t${input.organism}`,
    `Avoid uridine depletion\t\t${input.avoidUridineDepletion}`,
    `Avoid ribosome slip\t\t${input.avoidRibosomeSlip}`,
    `GC content minimum\t\t${input.gcContentMin}`,
    `GC content maximum\t\t${input.gcContentMax}`,
    `GC content window\t\t${input.gcContentWindow}`,
    `Avoid cut sites\t\t\t${input.avoidRestrictionSites}`,
    `Avoid sequences\t\t\t${input.avoidSequences}`,
    `Avoid repeat length\t\t${input.avoidRepeatLength}`,
    `Avoid poly(U)\t\t\t${input.avoidPolyT}`,
    `Avoid poly(A)\t\t\t${input.avoidPolyA}`,
    `Avoid poly(C)\t\t\t${input.avoidPolyC}`,
    `Avoid poly(G}\t\t\t${input.avoidPolyG}`,
    `Hairpin stem size\t\t${input.hairpinStemSize}`,
    `Hairpin window\t\t\t${input.hairpinWindow}`,
  ];

  const outputReports = results.outputs.map(
    ({ optimization, cdsAnalysis, fullSequenceAnalysis }, index) => [
      `---Optimized Sequence #${index + 1}`,
      "",
      `CDS:\t\t\t${optimization.output}`,
      "",
      `Full-length mRNA:\t${input.fivePrimeUTR + optimization.output + input.threePrimeUTR + input.polyATail}`,
      "",
      "---Results",
      "Metric\t\t\tInput\tOptimized",
      `A ratio\t\t\t${results.input.cdsAnalysis.a_ratio.toFixed(2)}\t${cdsAnalysis.a_ratio.toFixed(2)}`,
      `T/U ratio\t\t${results.input.cdsAnalysis.t_ratio.toFixed(2)}\t${cdsAnalysis.t_ratio.toFixed(2)}`,
      `G ratio\t\t\t${results.input.cdsAnalysis.g_ratio.toFixed(2)}\t${cdsAnalysis.g_ratio.toFixed(2)}`,
      `C ratio\t\t\t${results.input.cdsAnalysis.c_ratio.toFixed(2)}\t${cdsAnalysis.c_ratio.toFixed(2)}`,
      `AT ratio\t\t${results.input.cdsAnalysis.at_ratio.toFixed(2)}\t${cdsAnalysis.at_ratio.toFixed(2)}`,
      `GA ratio\t\t${results.input.cdsAnalysis.ga_ratio.toFixed(2)}\t${cdsAnalysis.ga_ratio.toFixed(2)}`,
      `GC ratio\t\t${results.input.cdsAnalysis.gc_ratio.toFixed(2)}\t${cdsAnalysis.gc_ratio.toFixed(2)}`,
      `Uridine depletion\t${results.input.cdsAnalysis.uridine_depletion?.toFixed(2) ?? "-"}\t${cdsAnalysis.uridine_depletion?.toFixed(2) ?? "-"}`,
      `CAI\t\t\t${results.input.cdsAnalysis.codon_adaptation_index?.toFixed(2) ?? "-"}\t${cdsAnalysis.codon_adaptation_index?.toFixed(2) ?? "-"}`,
      `CDS MFE (kcal/mol)\t${results.input.cdsAnalysis.minimum_free_energy[1].toFixed(2)}\t${cdsAnalysis.minimum_free_energy[1].toFixed(2)}`,
      `5' UTR MFE (kcal/mol)\t${results.input.fivePrimeUTRAnalysis?.minimum_free_energy[1].toFixed(2) ?? "-"}\t${results.input.fivePrimeUTRAnalysis?.minimum_free_energy[1].toFixed(2) ?? "-"}`,
      `3' UTR MFE (kcal/mol)\t${results.input.threePrimeUTRAnalysis?.minimum_free_energy[1].toFixed(2) ?? "-"}\t${results.input.threePrimeUTRAnalysis?.minimum_free_energy[1].toFixed(2) ?? "-"}`,
      `Total MFE (kcal/mol)\t${results.input.fullSequenceAnalysis?.minimum_free_energy[1].toFixed(2) ?? "-"}\t${fullSequenceAnalysis?.minimum_free_energy[1].toFixed(2) ?? "-"}`,
    ],
  );

  const reportText = [
    ...inputReport,
    ...outputReports.reduce(
      (accumulator, current) => accumulator.concat([""], current),
      [],
    ),
    "",
  ].join("\n");

  return (
    <Stack>
      <Group justify="space-between">
        <Button
          variant="subtle"
          size="sm"
          onClick={onClickBack}
          leftSection={<CaretLeftIcon />}
        >
          Back
        </Button>
        <Group>
          <Button
            component="a"
            href={URL.createObjectURL(
              new Blob([reportText], { type: "text/plain" }),
            )}
            download={`report-${new Date().toISOString()}.txt`}
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
                  "The Minimum Free Energy of the 3' UTR sequences. Lower values of MFE are associated with the formation of stable secondary structures",
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
              sequence optimizer. Bioinformatics, 36(16), 2874-2875.
            </li>
            <li>
              Sharp, P. M., & Li, W. H. (1987). The Codon Adaptation Index—a
              measure of directional synonymous codon usage bias, and its
              potential applications. Nucleic Acids Research 15(3), 1281-1295.
            </li>
            <li>
              Lorenz, R., Bernhart, S. H., Höner Zu Siederdissen, C., Tafer, H.,
              Flamm, C., Stadler, P. F., & Hofacker, I. L. (2011). ViennaRNA
              Package 2.0. Algorithms for Molecular Biology, 6(1), 26.
            </li>
            <li>
              Mulroney, T.E., Pöyry, T., Yam-Puc, J.C. et al. (2024).
              N1-methylpseudouridylation of mRNA causes +1 ribosomal
              frameshifting. Nature 625, 189–194.
            </li>
          </ol>
        </Alert>
      )}
      <Table
        highlightOnHover
        stickyHeader
        stickyHeaderOffset={79}
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
                  {input.fivePrimeUTR}
                </Text>
              </Tooltip>
              <Tooltip label="Coding sequence">
                <Text component="span">{output.optimization.output}</Text>
              </Tooltip>
              <Tooltip label="3' UTR">
                <Text component="span" c="green">
                  {input.threePrimeUTR}
                </Text>
              </Tooltip>
              <Tooltip label="Poly(A) tail">
                <Text component="span" c="blue">
                  {input.polyATail}
                </Text>
              </Tooltip>
            </Text>
          </Tabs.Panel>
        ))}
      </Tabs>
    </Stack>
  );
};
