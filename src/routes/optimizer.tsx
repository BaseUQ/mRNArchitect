import {
  Alert,
  Box,
  Button,
  Center,
  Fieldset,
  Flex,
  Group,
  InputWrapper,
  Loader,
  LoadingOverlay,
  Modal,
  MultiSelect,
  NativeSelect,
  NumberInput,
  Radio,
  RangeSlider,
  Space,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useInterval } from "@mantine/hooks";
import {
  CaretLeftIcon,
  DownloadSimpleIcon,
  QuestionIcon,
} from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { formatDuration } from "date-fns";
import { useEffect, useState } from "react";
import RESTRICTION_SITES from "~/data/restriction-sites.json";
import {
  analyzeSequence,
  convertSequenceToNucleicAcid,
  optimizeSequence,
} from "~/server/optimize";
import {
  type AnalyzeResponse,
  OptimizationRequest,
  type OptimizationResponse,
} from "~/types/optimize";

const FIVE_PRIME_HUMAN_ALPHA_GLOBIN = "ACTCTTCTGGTCCCCACAGACTCAGAGAGAACCCACC";
const THREE_PRIME_HUMAN_ALPHA_GLOBIN =
  "GCTGGAGCCTCGGTGGCCATGCTTCTTGCCCCTTGGGCCTCCCCCCAGCCCCTCCTCCCCTTCCTGCACCCGTACCCCCGTGGTCTTTGAATAAAGTCTGAGTGGGCGGCA";

export const Route = createFileRoute("/optimizer")({
  component: RouteComponent,
});

function RouteComponent() {
  return <OptimizeForm />;
}

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
      "5'UTR MFE (kcal/mol)",
      (v) =>
        results.input.fivePrimeUTRAnalysis?.minimum_free_energy[1].toFixed(2) ??
        "-",
    ),
    generateRow(
      "3'UTR MFE (kcal/mol)",
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
    `5'UTR\t\t${input.fivePrimeUTR}`,
    `3'UTR\t\t${input.threePrimeUTR}`,
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
      `5'UTR MFE (kcal/mol)\t${results.input.fivePrimeUTRAnalysis?.minimum_free_energy[1].toFixed(2) ?? "-"}\t${results.input.fivePrimeUTRAnalysis?.minimum_free_energy[1].toFixed(2) ?? "-"}`,
      `3'UTR MFE (kcal/mol)\t${results.input.threePrimeUTRAnalysis?.minimum_free_energy[1].toFixed(2) ?? "-"}\t${results.input.threePrimeUTRAnalysis?.minimum_free_energy[1].toFixed(2) ?? "-"}`,
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
                  "Full-legth mRNA",
                  "These are the output mRNA sequences that have been assembled and optimized according to the user parameters.",
                ],
                [
                  "A/U/G/C ratio",
                  "The nucleotide composition of the input and output optimised mRNA sequences. High GC content is correlated with stable secondary structure, and low U associated with reactogenicity.",
                ],
                [
                  "AT/GA/GC ratio",
                  "The dinucleotide composition of the input and output mRNA sequences. High GC content is correlated with stable secondary structure.",
                ],
                [
                  "Uridine depletion",
                  "The fraction of codons with uridine in the third nucleotide position. Maximum and minimum values are 1 (all) and 0 (no) codons with uridine in third nucleotide position.",
                ],
                [
                  "CAI",
                  "The Codon Adaptation Index (CAI) is a measure of deviation between the codon usage of the mRNA sequence from the preferred codon usage of the organism (2). The CAI score ranges from 0 (totally dissimilar) to 1 (all mRNA codons match the organism's codon usage reference table).",
                ],
                [
                  "CDS MFE",
                  "The Minimum Free Energy (MFE) is the lowest Gibbs free energy change associated with the formation of secondary structures in RNA molecules due to intramolecular base pairing (3). Lower values of MFE are associated with the formation of more stable secondary structures and hairpins that can occlude translation and expression.",
                ],
                [
                  "5'UTR MFE",
                  "The Minimum Free Energy of the 5' UTR sequences. Lower values of MFE are associated with reduced secondary structures.",
                ],
                [
                  "3'UTR MFE",
                  "The Minimum Free Energy of the 3' UTR sequences. Lower values of MFE are associated with reduced secondary structures.",
                ],
                [
                  "Total MFE",
                  "The Minimum Free Energy of the full sequence (5' UTR, coding sequence, 3' UTR and poly(A) tail). Lower values of MFE are associated with reduced secondary structures.",
                ],
              ],
            }}
          />
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
              <Tooltip label="5'UTR">
                <Text component="span" c="green">
                  {input.fivePrimeUTR}
                </Text>
              </Tooltip>
              <Tooltip label="Coding sequence">
                <Text component="span">{output.optimization.output}</Text>
              </Tooltip>
              <Tooltip label="3'UTR">
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

export const OptimizeForm = () => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showParameters, setShowParameters] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [fivePrimeUTRSequenceType, setFivePrimeUTRSequenceType] = useState<
    "human-alpha-globin" | "custom"
  >("custom");
  const [threePrimeUTRSequenceType, setThreePrimeUTRSequenceType] = useState<
    "human-alpha-globin" | "custom"
  >("custom");
  const [polyATailType, setPolyATailType] = useState<
    "none" | "generate" | "custom"
  >("none");
  const [polyATailGenerate, setPolyATailGenerate] = useState<string | number>(
    120,
  );
  const [results, setResults] = useState<OptimizationResults["results"] | null>(
    null,
  );
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const elapsedInterval = useInterval(
    () => setElapsedSeconds((s) => s + 1),
    1000,
    { autoInvoke: true },
  );

  const form = useForm<OptimizationRequest>({
    mode: "uncontrolled",
    initialValues: {
      sequenceType: "nucleic-acid",
      sequence: "",
      fivePrimeUTR: "",
      threePrimeUTR: "",
      polyATail: "",
      numberOfSequences: 3,
      organism: "h_sapiens",
      avoidUridineDepletion: false,
      avoidRibosomeSlip: false,
      gcContentMin: 0.4,
      gcContentMax: 0.7,
      gcContentWindow: 100,
      avoidRestrictionSites: [],
      avoidSequences: "",
      avoidRepeatLength: 10,
      avoidPolyT: 9,
      avoidPolyA: 9,
      avoidPolyC: 6,
      avoidPolyG: 6,
      hairpinStemSize: 10,
      hairpinWindow: 60,
    },
    validate: (values) => {
      const result = OptimizationRequest.safeParse(values);
      if (!result.error) {
        return {};
      }
      return Object.fromEntries(
        result.error.issues
          .filter((issue) => issue.path.length)
          .map((issue) => [issue.path[0], issue.message]),
      );
    },
  });

  useEffect(() => {
    if (fivePrimeUTRSequenceType === "human-alpha-globin") {
      form.setFieldValue("fivePrimeUTR", FIVE_PRIME_HUMAN_ALPHA_GLOBIN);
    }
  }, [form, fivePrimeUTRSequenceType]);

  useEffect(() => {
    if (threePrimeUTRSequenceType === "human-alpha-globin") {
      form.setFieldValue("threePrimeUTR", THREE_PRIME_HUMAN_ALPHA_GLOBIN);
    }
  }, [form, threePrimeUTRSequenceType]);

  useEffect(() => {
    if (polyATailType === "none") {
      form.setFieldValue("polyATail", "");
    } else if (polyATailType === "generate") {
      form.setFieldValue(
        "polyATail",
        Array(polyATailGenerate).fill("A").join(""),
      );
    }
  }, [form, polyATailGenerate, polyATailType]);

  const handleOnSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    setElapsedSeconds(0);
    try {
      let sequence = values.sequence;
      if (values.sequenceType === "amino-acid") {
        sequence = await convertSequenceToNucleicAcid({
          data: { sequence: values.sequence, organism: values.organism },
        });
      }
      const parsedValues = { ...values, sequence };

      const [
        inputCdsAnalysis,
        inputFivePrimeUTRAnalysis,
        inputThreePrimeUTRAnalysis,
        inputFullSequenceAnalysis,
        ...outputs
      ] = await Promise.all([
        analyzeSequence({
          data: {
            sequence: parsedValues.sequence,
            organism: parsedValues.organism,
          },
        }),
        parsedValues.fivePrimeUTR
          ? analyzeSequence({
              data: {
                sequence: parsedValues.fivePrimeUTR,
                organism: parsedValues.organism,
              },
            })
          : null,
        parsedValues.threePrimeUTR
          ? analyzeSequence({
              data: {
                sequence: parsedValues.threePrimeUTR,
                organism: parsedValues.organism,
              },
            })
          : null,
        analyzeSequence({
          data: {
            sequence: `${parsedValues.fivePrimeUTR}${parsedValues.sequence}${parsedValues.threePrimeUTR}${parsedValues.polyATail}`,
            organism: parsedValues.organism,
          },
        }),

        ...Array(values.numberOfSequences)
          .fill(null)
          .map(() =>
            optimizeSequence({ data: parsedValues }).then(
              async (optimization) => {
                const [cdsAnalysis, fullSequenceAnalysis] = await Promise.all([
                  analyzeSequence({
                    data: {
                      sequence: optimization.output,
                      organism: parsedValues.organism,
                    },
                  }),
                  analyzeSequence({
                    data: {
                      sequence: `${parsedValues.fivePrimeUTR}${parsedValues.sequence}${parsedValues.threePrimeUTR}${parsedValues.polyATail}`,
                      organism: parsedValues.organism,
                    },
                  }),
                ]);
                return {
                  optimization,
                  cdsAnalysis,
                  fullSequenceAnalysis,
                };
              },
            ),
          ),
      ]);
      setResults({
        input: {
          cdsAnalysis: inputCdsAnalysis,
          fivePrimeUTRAnalysis: inputFivePrimeUTRAnalysis,
          threePrimeUTRAnalysis: inputThreePrimeUTRAnalysis,
          fullSequenceAnalysis: inputFullSequenceAnalysis,
        },
        outputs: outputs.sort((a, b) =>
          (a.cdsAnalysis.codon_adaptation_index ?? 0) >
          (b.cdsAnalysis.codon_adaptation_index ?? 0)
            ? -1
            : 1,
        ),
      });
    } catch (e) {
      console.error(e);
    }
    setIsSubmitting(false);
  };

  if (results) {
    return (
      <OptimizationResults
        input={form.getValues()}
        results={results}
        onClickBack={() => setResults(null)}
      />
    );
  }

  return (
    <>
      <Modal
        opened={isSubmitting}
        onClose={() => {}}
        withCloseButton={false}
        centered
        transitionProps={{ transition: "fade", duration: 200 }}
      >
        <Center p="lg">
          <Stack align="center">
            <Loader type="dots" />
            <Text>Optimisation in progress...</Text>
            <Text>{`Elapsed time: ${formatDuration({ seconds: elapsedSeconds }, { zero: true })}`}</Text>
          </Stack>
        </Center>
      </Modal>
      <form onSubmit={form.onSubmit(handleOnSubmit)}>
        <Box pos="relative">
          <LoadingOverlay
            visible={isSubmitting}
            zIndex={1000}
            overlayProps={{ radius: "sm", blur: 2 }}
          />
        </Box>

        <Stack>
          <Group justify="flex-end">
            <Switch
              label="Show additional parameters"
              checked={showParameters}
              onChange={(event) =>
                setShowParameters(event.currentTarget.checked)
              }
            />
            <Switch
              label="Show help"
              checked={showHelp}
              onChange={(event) => setShowHelp(event.currentTarget.checked)}
            />
          </Group>
          {showHelp && (
            <Alert title="Help" variant="light" icon={<QuestionIcon />}>
              <Text>
                mRNArchitect is a software toolkit to assist in the design of
                mRNA sequences. mRNArchitect can rapidly assemble and optimize
                mRNA sequences based on user requirements, including GC content,
                secondary structure, codon optimization, and uridine depletion.
                The sequences generated by mRNArchitect can also be readily
                synthesized, and have been experimentally validated across a
                variety of applications.
              </Text>
              <Space h="xs" />
              <Text>
                For guidance on how to design an mRNA, please see the
                step-by-step example{" "}
                <a href="https://basefacility.org.au/wp-content/uploads/2024/12/mRNArchitect_Example.pdf">
                  here
                </a>
                .
              </Text>
              <Space h="xs" />
              <Text>
                Please find useful sequences (promoters, UTRs etc.){" "}
                <a href="https://basefacility.org.au/wp-content/uploads/2024/12/mRNArchitect_ExampleSequences.txt">
                  here
                </a>
                .
              </Text>
              <Title order={5} pt="sm">
                References
              </Title>
              <ul>
                <li>
                  Zulkower, V., & Rosser, S. (2020). DNA Chisel, a versatile
                  sequence optimizer. Bioinformatics, 36(16), 2874-2875.
                </li>
                <li>
                  Sharp, P. M., & Li, W. H. (1987). The Codon Adaptation Index—a
                  measure of directional synonymous codon usage bias, and its
                  potential applications. Nucleic Acids Research 15(3),
                  1281-1295.
                </li>
                <li>
                  Lorenz, R., Bernhart, S. H., Höner Zu Siederdissen, C., Tafer,
                  H., Flamm, C., Stadler, P. F., & Hofacker, I. L. (2011).
                  ViennaRNA Package 2.0. Algorithms for Molecular Biology, 6(1),
                  26.
                </li>
                <li>
                  Mulroney, T.E., Pöyry, T., Yam-Puc, J.C. et al. (2024).
                  N1-methylpseudouridylation of mRNA causes +1 ribosomal
                  frameshifting. Nature 625, 189–194.
                </li>
              </ul>
            </Alert>
          )}
          <Fieldset legend="Sequence" disabled={isSubmitting}>
            <Stack>
              <div>
                <Radio.Group
                  label="Coding sequence"
                  description={
                    showHelp &&
                    "Add your coding sequence of interest here. You can paste either the amino acid, RNA or DNA sequence. You may also want to consider adding useful sequence elements such as nuclear localization signals, signal peptides, or other tags. Ensure your coding sequence starts with a MET codon and ends with a STOP codon. You may want to use two different stop codons for efficient termination (e.g., UAG/UGA)."
                  }
                  withAsterisk
                  key={form.key("sequenceType")}
                  {...form.getInputProps("sequenceType")}
                >
                  <Group style={{ padding: "5px" }}>
                    <Radio value="nucleic-acid" label="Nucleic acid" />
                    <Radio value="amino-acid" label="Amino acid" />
                  </Group>
                </Radio.Group>
                <Textarea
                  placeholder="Paste your sequence here..."
                  autosize
                  minRows={5}
                  resize="vertical"
                  withAsterisk
                  key={form.key("sequence")}
                  {...form.getInputProps("sequence")}
                />
              </div>

              <div>
                <Radio.Group
                  label="5'UTR"
                  description={
                    showHelp &&
                    "Add your 5' untranslated sequence here. The 5'UTR is bound and scanned by the ribosome and is needed for translation. By default, we use the human alpha-globin (HBA1; Gene ID 3039) 5’UTR that has been validated in different cell types and applications."
                  }
                  withAsterisk
                  value={fivePrimeUTRSequenceType}
                  onChange={(v) =>
                    setFivePrimeUTRSequenceType(
                      v as typeof fivePrimeUTRSequenceType,
                    )
                  }
                >
                  <Group style={{ padding: "5px" }}>
                    <Radio
                      value="human-alpha-globin"
                      label="Human alpha-globin"
                    />
                    <Radio value="custom" label="Custom" />
                  </Group>
                </Radio.Group>
                <Textarea
                  disabled={fivePrimeUTRSequenceType === "human-alpha-globin"}
                  placeholder="Paste your sequence here..."
                  autosize
                  minRows={2}
                  resize="vertical"
                  withAsterisk
                  key={form.key("fivePrimeUTR")}
                  {...form.getInputProps("fivePrimeUTR")}
                />
              </div>

              <div>
                <Radio.Group
                  label="3'UTR"
                  description={
                    showHelp &&
                    "Paste your 3’ untranslated sequence here. The 3'UTR is regulated by microRNAs and RNA-binding proteins and plays a key role in cell-specific mRNA stability and expression. By default, we use the human alpha-globin (HBA1; Gene ID 3039) 3’UTR that has been validated in different cell types and applications."
                  }
                  withAsterisk
                  value={threePrimeUTRSequenceType}
                  onChange={(v) =>
                    setThreePrimeUTRSequenceType(
                      v as typeof threePrimeUTRSequenceType,
                    )
                  }
                >
                  <Group style={{ padding: "5px" }}>
                    <Radio
                      value="human-alpha-globin"
                      label="Human alpha-globin"
                    />
                    <Radio value="custom" label="Custom" />
                  </Group>
                </Radio.Group>
                <Textarea
                  disabled={threePrimeUTRSequenceType === "human-alpha-globin"}
                  placeholder="Paste your sequence here..."
                  autosize
                  minRows={2}
                  resize="vertical"
                  withAsterisk
                  key={form.key("threePrimeUTR")}
                  {...form.getInputProps("threePrimeUTR")}
                />
              </div>

              <div>
                <Radio.Group
                  label="Poly(A) tail"
                  description={
                    showHelp &&
                    "Specify the length of the poly(A) tail or alternatively paste more complex designs. The length of the poly(A) tail plays a critical role in mRNA translation and stability. By default, no tail will be added."
                  }
                  withAsterisk
                  value={polyATailType}
                  onChange={(v) => setPolyATailType(v as typeof polyATailType)}
                >
                  <Group style={{ padding: "5px" }}>
                    <Radio value="none" label="None" />
                    <Radio value="generate" label="Generate" />
                    <Radio value="custom" label="Custom" />
                  </Group>
                </Radio.Group>
                {polyATailType === "generate" && (
                  <NumberInput
                    min={1}
                    stepHoldDelay={500}
                    stepHoldInterval={100}
                    value={polyATailGenerate}
                    onChange={setPolyATailGenerate}
                  />
                )}
                {polyATailType === "custom" && (
                  <Textarea
                    placeholder="Paste your sequence here..."
                    autosize
                    minRows={2}
                    resize="vertical"
                    withAsterisk
                    key={form.key("polyATail")}
                    {...form.getInputProps("polyATail")}
                  />
                )}
              </div>
            </Stack>
          </Fieldset>
          {showParameters && (
            <Fieldset legend="Parameters" disabled={isSubmitting}>
              <Stack>
                <NumberInput
                  label="Number of sequences"
                  description={
                    showHelp &&
                    "The number of optimized output mRNA sequences to generate. Please note that more sequences takes longer and there is a maximum of 10."
                  }
                  min={1}
                  max={10}
                  step={1}
                  key={form.key("numberOfSequences")}
                  {...form.getInputProps("numberOfSequences")}
                />
                <NativeSelect
                  label="Organism"
                  description={
                    showHelp &&
                    "Select the target organism to be used for codon optimisation. The mRNA will be optimised using the preferred codon usage of highly expressed genes in this selected organism (1). By default, we use human codon optimisation."
                  }
                  data={[
                    { label: "Human", value: "h_sapiens" },
                    { label: "Mouse", value: "m_musculus" },
                  ]}
                  key={form.key("organism")}
                  {...form.getInputProps("organism")}
                />
                <Switch
                  label="Uridine depletion"
                  description={
                    showHelp &&
                    "If selected, this minimizes the use of uridine nucleosides in the mRNA sequence. This is achieved by avoiding codons that encode uridine at the third wobble position and can impact reactogenicity of the mRNA sequence."
                  }
                  key={form.key("avoidUridineDepletion")}
                  {...form.getInputProps("avoidUridineDepletion")}
                />
                <Switch
                  label="Avoid ribosome slip"
                  description={
                    showHelp &&
                    "Avoid more than 3 Us in the open-reading frame, where ribosomes can +1 frameshift at consecutive N1-methylpseudouridines (Mulroney et. al., 2024)."
                  }
                  key={form.key("avoidRibosomeSlip")}
                  {...form.getInputProps("avoidRibosomeSlip")}
                />
                <InputWrapper
                  label="Minimum/maximum GC content"
                  description={
                    showHelp &&
                    "Defines the minimum or maximum fraction of the mRNA sequence comprising G/C nucleotides that is associated with stability and hairpins of the mRNA. We recommend 0.4 and 0.7."
                  }
                >
                  <RangeSlider
                    min={0}
                    max={1}
                    step={0.05}
                    minRange={0}
                    marks={[
                      { value: 0, label: "0" },
                      { value: 0.25, label: "0.25" },
                      { value: 0.5, label: "0.5" },
                      { value: 0.75, label: "0.75" },
                      { value: 1, label: "1" },
                    ]}
                    key={form.key("minMaxGCContent")}
                    value={[
                      form.getValues().gcContentMin,
                      form.getValues().gcContentMax,
                    ]}
                    onChange={([min, max]) => {
                      form.setFieldValue("gcContentMin", min);
                      form.setFieldValue("gcContentMax", max);
                    }}
                  />
                </InputWrapper>
                <NumberInput
                  label="GC content window"
                  description={
                    showHelp &&
                    "The window size across which the min/max GC content is calculated and imposed. We recommend 100."
                  }
                  min={1}
                  step={1}
                  key={form.key("gcContentWindow")}
                  {...form.getInputProps("gcContentWindow")}
                />
                <MultiSelect
                  label="Avoid cut sites"
                  description={
                    showHelp &&
                    "Avoid restriction enzyme sites in the sequence."
                  }
                  placeholder="Choose sites..."
                  searchable
                  data={Object.keys(RESTRICTION_SITES)
                    .sort()
                    .map((v) => ({
                      label: v,
                      value: v,
                    }))}
                  key={form.key("avoidRestrictionSites")}
                  {...form.getInputProps("avoidRestrictionSites")}
                />
                <TextInput
                  label="Avoid sequences"
                  description={
                    showHelp &&
                    "Specify sequences that should be avoided in the mRNA sequence."
                  }
                  placeholder="e.g. ATGATG"
                  key={form.key("avoidSequences")}
                  {...form.getInputProps("avoidSequences")}
                />
                <NumberInput
                  label="Avoid repeat length"
                  description={
                    showHelp &&
                    "Avoid repeating any sequences longer than this length within the mRNA. We recommend 10 nucleotides."
                  }
                  min={6}
                  max={20}
                  step={1}
                  key={form.key("avoidRepeatLength")}
                  {...form.getInputProps("avoidRepeatLength")}
                />
                <InputWrapper
                  label="Avoid homopolymer tracts"
                  description={
                    showHelp &&
                    "Avoid homopolymer tracts that can be difficult to synthesise and translate. We recommend 9 for poly(U)/poly(A) and 6 for poly(C)/poly(G)."
                  }
                >
                  <Flex
                    direction={{ base: "column", sm: "row" }}
                    justify="space-between"
                    gap="sm"
                    pl="sm"
                  >
                    <NumberInput
                      label="Poly(U)"
                      min={0}
                      step={1}
                      key={form.key("avoidPolyT")}
                      {...form.getInputProps("avoidPolyT")}
                    />
                    <NumberInput
                      label="Poly(A)"
                      min={0}
                      step={1}
                      key={form.key("avoidPolyA")}
                      {...form.getInputProps("avoidPolyA")}
                    />
                    <NumberInput
                      label="Poly(C)"
                      min={0}
                      step={1}
                      key={form.key("avoidPolyC")}
                      {...form.getInputProps("avoidPolyC")}
                    />
                    <NumberInput
                      label="Poly(G)"
                      min={0}
                      step={1}
                      key={form.key("avoidPolyG")}
                      {...form.getInputProps("avoidPolyG")}
                    />
                  </Flex>
                </InputWrapper>
                <NumberInput
                  label="Hairpin stem size"
                  description={
                    showHelp &&
                    "Avoid stable hairpins longer than this length. We recommend 10."
                  }
                  min={0}
                  step={1}
                  key={form.key("hairpinStemSize")}
                  {...form.getInputProps("hairpinStemSize")}
                />
                <NumberInput
                  label="Hairpin window"
                  description={
                    showHelp &&
                    "Window size used to measure hairpins. We recommend 60."
                  }
                  min={0}
                  step={1}
                  key={form.key("hairpinWindow")}
                  {...form.getInputProps("hairpinWindow")}
                />
              </Stack>
            </Fieldset>
          )}
          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Optimization in progress..." : "Optimize sequence"}
          </Button>
        </Stack>
      </form>
    </>
  );
};
