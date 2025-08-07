import {
  Button,
  Card,
  Group,
  Modal,
  type ModalProps,
  Stack,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { Fragment } from "react/jsx-runtime";
import type {
  OptimizationParameter,
  OptimizationResult,
} from "~/types/optimize";
import type { Sequence } from "~/types/sequence";
import { nucleotideCDSLength } from "~/utils/sequence";
import type { OptimizationInput, OptimizationOutput } from "./types";

const parameterTitle = (
  sequence: Sequence,
  parameter: OptimizationParameter,
): string => {
  const start = parameter.startCoordinate ?? 1;
  const end = parameter.endCoordinate ?? nucleotideCDSLength(sequence);
  return `Parameter region [${start}-${end}]`;
};

const generateReport = ({
  input: { sequence, parameters },
  output,
}: OutputProps): string => {
  const date = new Date();
  const inputReport = [
    "---mRNArchitect",
    "Version\t0.3.1",
    `Date\t${format(date, "do MMM yyyy")}`,
    `Time\t${format(date, "HH:mm:ss x")}`,
    "",
    "---Input Sequence",
    `CDS\t\t${sequence.codingSequence}`,
    `5' UTR\t\t${sequence.fivePrimeUtr}`,
    `3' UTR\t\t${sequence.threePrimeUtr}`,
    `Poly(A) tail\t${sequence.polyATail}`,
  ];

  const parameterReports = parameters
    .map((c) => [
      `---${parameterTitle(sequence, c)}`,
      `Start coordinate\t\t${c.startCoordinate || "1"}`,
      `End coordinate\t\t\t${c.endCoordinate || output.outputs[0].optimization.result.sequence.nucleicAcidSequence.length}`,
      `Organism\t\t\t${c.organism}`,
      `Avoid repeat length\t\t${c.avoidRepeatLength}`,
      `Enable uridine depletion\t${c.enableUridineDepletion}`,
      `Avoid ribosome slip\t\t${c.avoidRibosomeSlip}`,
      `Avoid microRNA seed sites\t${c.avoidMicroRnaSeedSites}`,
      `GC content minimum\t\t${c.gcContentMin}`,
      `GC content maximum\t\t${c.gcContentMax}`,
      `GC content window\t\t${c.gcContentWindow}`,
      `Avoid cut sites\t\t\t${c.avoidRestrictionSites}`,
      `Avoid sequences\t\t\t${c.avoidSequences}`,
      `Avoid poly(U)\t\t\t${c.avoidPolyT}`,
      `Avoid poly(A)\t\t\t${c.avoidPolyA}`,
      `Avoid poly(C)\t\t\t${c.avoidPolyC}`,
      `Avoid poly(G)\t\t\t${c.avoidPolyG}`,
      `Hairpin stem size\t\t${c.hairpinStemSize}`,
      `Hairpin window\t\t\t${c.hairpinWindow}`,
    ])
    .reduce((prev, current) => prev.concat([""], current), []);

  const outputReports = output.outputs.map(
    ({ optimization, cdsAnalysis, fullSequenceAnalysis }, index) => [
      `---Optimised Sequence #${index + 1}`,
      "",
      `CDS:\t\t\t${optimization.result.sequence.nucleicAcidSequence}`,
      "",
      `Full-length mRNA:\t${sequence.fivePrimeUtr + optimization.result.sequence.nucleicAcidSequence + sequence.threePrimeUtr + sequence.polyATail}`,
      "",
      "---Results",
      "Metric\t\t\tInput\tOptimised",
      `A ratio\t\t\t${output.input.cdsAnalysis.aRatio.toFixed(2)}\t${cdsAnalysis.aRatio.toFixed(2)}`,
      `T/U ratio\t\t${output.input.cdsAnalysis.tRatio.toFixed(2)}\t${cdsAnalysis.tRatio.toFixed(2)}`,
      `G ratio\t\t\t${output.input.cdsAnalysis.gRatio.toFixed(2)}\t${cdsAnalysis.gRatio.toFixed(2)}`,
      `C ratio\t\t\t${output.input.cdsAnalysis.cRatio.toFixed(2)}\t${cdsAnalysis.cRatio.toFixed(2)}`,
      `AT ratio\t\t${output.input.cdsAnalysis.atRatio.toFixed(2)}\t${cdsAnalysis.atRatio.toFixed(2)}`,
      `GA ratio\t\t${output.input.cdsAnalysis.gaRatio.toFixed(2)}\t${cdsAnalysis.gaRatio.toFixed(2)}`,
      `GC ratio\t\t${output.input.cdsAnalysis.gcRatio.toFixed(2)}\t${cdsAnalysis.gcRatio.toFixed(2)}`,
      `Uridine depletion\t${output.input.cdsAnalysis.uridineDepletion?.toFixed(2) ?? "-"}\t${cdsAnalysis.uridineDepletion?.toFixed(2) ?? "-"}`,
      `CAI\t\t\t${output.input.cdsAnalysis.codonAdaptationIndex?.toFixed(2) ?? "-"}\t${cdsAnalysis.codonAdaptationIndex?.toFixed(2) ?? "-"}`,
      `CDS MFE (kcal/mol)\t${output.input.cdsAnalysis.minimumFreeEnergy.energy.toFixed(2)}\t${cdsAnalysis.minimumFreeEnergy.energy.toFixed(2)}`,
      `5' UTR MFE (kcal/mol)\t${output.input.fivePrimeUtrAnalysis?.minimumFreeEnergy.energy.toFixed(2) ?? "-"}\t${output.input.fivePrimeUtrAnalysis?.minimumFreeEnergy.energy.toFixed(2) ?? "-"}`,
      `3' UTR MFE (kcal/mol)\t${output.input.threePrimeUtrAnalysis?.minimumFreeEnergy.energy.toFixed(2) ?? "-"}\t${output.input.threePrimeUtrAnalysis?.minimumFreeEnergy.energy.toFixed(2) ?? "-"}`,
      `Total MFE (kcal/mol)\t${output.input.fullSequenceAnalysis?.minimumFreeEnergy.energy.toFixed(2) ?? "-"}\t${fullSequenceAnalysis?.minimumFreeEnergy.energy.toFixed(2) ?? "-"}`,
    ],
  );

  const reportText = [
    ...inputReport,
    "",
    "---Optimisation parameters:",
    ...parameterReports,
    "",
    ...outputReports.reduce(
      (accumulator, current) => accumulator.concat([""], current),
      [],
    ),
    "",
  ];

  return reportText.join("\n");
};

const LogsModal = ({
  optimizationResults,
  ...props
}: {
  optimizationResults: OptimizationResult[];
} & ModalProps) => {
  return (
    <Modal title="Logs" size="auto" {...props}>
      <Tabs defaultValue={"0"}>
        <Tabs.List>
          {optimizationResults.map((_, index) => (
            <Tabs.Tab
              // biome-ignore lint/suspicious/noArrayIndexKey: No other suitable key
              key={index}
              value={`${index}`}
            >{`Output ${index + 1}`}</Tabs.Tab>
          ))}
        </Tabs.List>
        {optimizationResults.map((r, index) => (
          <Tabs.Panel
            // biome-ignore lint/suspicious/noArrayIndexKey: No other suitable noArrayIndexKey
            key={index}
            value={`${index}`}
            my="sm"
          >
            <Title order={4}>Constraints</Title>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {r.result.constraints.split("\n").map((v) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: No other suitable key
                <Fragment key={index}>
                  {v}
                  <br />
                </Fragment>
              ))}
            </pre>
            <Title order={4}>Objectives</Title>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {r.result.objectives.split("\n").map((v) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: No other suitable key
                <Fragment key={index}>
                  {v}
                  <br />
                </Fragment>
              ))}
            </pre>
          </Tabs.Panel>
        ))}
      </Tabs>
    </Modal>
  );
};

export interface OutputProps {
  input: OptimizationInput;
  output: OptimizationOutput;
}

export const Output = ({ input, output }: OutputProps) => {
  const [showLogsModal, setShowLogsModal] = useState<boolean>(false);

  const report = useMemo(
    () => generateReport({ input, output }),
    [input, output],
  );

  return (
    <Stack>
      <Group justify="end">
        <Group>
          <Button
            component="a"
            href={URL.createObjectURL(
              new Blob([report], { type: "text/plain" }),
            )}
            download={`mRNAchitect-report-${new Date().toISOString()}.txt`}
            leftSection={<DownloadSimpleIcon />}
          >
            Download (.txt format)
          </Button>
          <Group justify="flex-end">
            <Button
              size="sm"
              variant="transparent"
              onClick={() => setShowLogsModal(true)}
            >
              Show logs
            </Button>
          </Group>
          <LogsModal
            opened={showLogsModal}
            size="auto"
            onClose={() => setShowLogsModal(false)}
            optimizationResults={output.outputs.map((v) => v.optimization)}
          />
        </Group>
      </Group>

      <Card withBorder>
        <Text ff="monospace" style={{ overflowWrap: "break-word" }}>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {report.split("\n").map((line) => (
              <Fragment key={line}>
                {line}
                <br />
              </Fragment>
            ))}
          </pre>
        </Text>
      </Card>
    </Stack>
  );
};
