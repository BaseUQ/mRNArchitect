import { Button, Card, Group, Stack, Text } from "@mantine/core";
import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { format } from "date-fns";
import { Fragment } from "react/jsx-runtime";
import type { OptimizationParameter } from "~/types/optimize";
import type { Sequence } from "~/types/sequence";
import type { OptimizationInput, OptimizationOutput } from "./types";

const parameterTitle = (
  sequence: Sequence,
  parameter: OptimizationParameter,
): string => {
  const start = parameter.startCoordinate ?? 1;
  const end = parameter.endCoordinate ?? sequence.codingSequence.length - 1;
  return `Parameter region [${start}-${end}]`;
};

export interface OutputProps {
  input: OptimizationInput;
  output: OptimizationOutput;
}

export const Output = ({
  input: { sequence, parameters },
  output,
}: OutputProps) => {
  const date = new Date();
  const inputReport = [
    "---mRNArchitect",
    "Version\t0.3",
    `Date\t${format(date, "do MMM yyyy")}`,
    `Time\t${format(date, "HH:mm:ss x")}`,
    "",
    "---Input Sequence",
    `CDS\t\t${sequence.codingSequence}`,
    `5' UTR\t\t${sequence.fivePrimeUTR}`,
    `3' UTR\t\t${sequence.threePrimeUTR}`,
    `Poly(A) tail\t${sequence.polyATail}`,
  ];

  const parameterReports = parameters
    .map((c) => [
      `---${parameterTitle(sequence, c)}`,
      `Start coordinate\t\t${c.startCoordinate || "1"}`,
      `End coordinate\t\t\t${c.endCoordinate || output.outputs[0].optimization.result.sequence.nucleicAcidSequence.length - 1}`,
      `Organism\t\t\t${c.organism}`,
      `Avoid repeat length\t\t${c.avoidRepeatLength}`,
      `Enable uridine depletion\t${c.enableUridineDepletion}`,
      `Avoid ribosome slip\t\t${c.avoidRibosomeSlip}`,
      `Avoid microRNA seed sites\t${c.avoidMicroRNASeedSites}`,
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
      `Full-length mRNA:\t${sequence.fivePrimeUTR + optimization.result.sequence.nucleicAcidSequence + sequence.threePrimeUTR + sequence.polyATail}`,
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
      `5' UTR MFE (kcal/mol)\t${output.input.fivePrimeUTRAnalysis?.minimumFreeEnergy.energy.toFixed(2) ?? "-"}\t${output.input.fivePrimeUTRAnalysis?.minimumFreeEnergy.energy.toFixed(2) ?? "-"}`,
      `3' UTR MFE (kcal/mol)\t${output.input.threePrimeUTRAnalysis?.minimumFreeEnergy.energy.toFixed(2) ?? "-"}\t${output.input.threePrimeUTRAnalysis?.minimumFreeEnergy.energy.toFixed(2) ?? "-"}`,
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

  return (
    <Stack>
      <Group justify="end">
        <Group>
          <Button
            component="a"
            href={URL.createObjectURL(
              new Blob([reportText.join("\n")], { type: "text/plain" }),
            )}
            download={`mRNAchitect-report-${new Date().toISOString()}.txt`}
            leftSection={<DownloadSimpleIcon />}
          >
            Download (.txt format)
          </Button>
        </Group>
      </Group>

      <Card withBorder>
        <Text ff="monospace" style={{ overflowWrap: "break-word" }}>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {reportText.map((line) => (
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
