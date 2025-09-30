import { Button, Card, Group, Stack, Text } from "@mantine/core";
import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { format } from "date-fns";
import { useMemo } from "react";
import { Fragment } from "react/jsx-runtime";
import type { OptimizationParameter } from "~/types/optimize";
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
  input: { name, sequence, parameters },
  output,
}: OutputProps): string => {
  const date = new Date();
  const inputReport = [
    "---mRNArchitect",
    "Version\t\t0.4",
    `Date\t\t${format(date, "do MMM yyyy")}`,
    `Time\t\t${format(date, "HH:mm:ss x")}`,
    `Sequence name\t${name}`,
    "",
    "---Input Sequence",
    `CDS\t\t${sequence.codingSequence}`,
    `5' UTR\t\t${sequence.fivePrimeUtr}`,
    `3' UTR\t\t${sequence.threePrimeUtr}`,
    `Poly(A) tail\t${sequence.polyATail}`,
  ];

  const parameterReports = parameters
    .map((c) => {
      const report: string[] = [
        `---${parameterTitle(sequence, c)}`,
        `Start coordinate\t\t\t${c.startCoordinate || "1"}`,
        `End coordinate\t\t\t\t${c.endCoordinate || output.outputs[0].optimization.result.sequence.nucleicAcidSequence.length}`,
        `Don't optimise region\t\t\t${c.enforceSequence}`,
      ];
      if (!c.enforceSequence) {
        report.push(
          ...[
            `Organism\t\t\t\t${c.codonUsageTable}`,
            `Avoid repeat length\t\t\t${c.avoidRepeatLength}`,
            `Enable uridine depletion\t\t${c.enableUridineDepletion}`,
            `Avoid ribosome slip\t\t\t${c.avoidRibosomeSlip}`,
            `Avoid manufacture restriction sites\t${c.avoidManufactureRestrictionSites}`,
            `Avoid microRNA seed sites\t\t${c.avoidMicroRnaSeedSites}`,
            `GC content minimum\t\t\t${c.gcContentMin}`,
            `GC content maximum\t\t\t${c.gcContentMax}`,
            `GC content window\t\t\t${c.gcContentWindow}`,
            `Avoid cut sites\t\t\t\t${c.avoidRestrictionSites}`,
            `Avoid sequences\t\t\t\t${c.avoidSequences}`,
            `Avoid poly(U)\t\t\t\t${c.avoidPolyT}`,
            `Avoid poly(A)\t\t\t\t${c.avoidPolyA}`,
            `Avoid poly(C)\t\t\t\t${c.avoidPolyC}`,
            `Avoid poly(G)\t\t\t\t${c.avoidPolyG}`,
            `Hairpin stem size\t\t\t${c.hairpinStemSize}`,
            `Hairpin window\t\t\t\t${c.hairpinWindow}`,
          ],
        );
      }
      return report;
    })
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
      "",
      "---Logs",
      ...optimization.result.constraints.trim().split("\n"),
      ...optimization.result.objectives.trim().split("\n"),
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

export interface OutputProps {
  input: OptimizationInput;
  output: OptimizationOutput;
}

export const Output = ({ input, output }: OutputProps) => {
  const report = useMemo(
    () => generateReport({ input, output }),
    [input, output],
  );

  return (
    <Stack>
      <Group justify="end">
        <Button
          component="a"
          href={URL.createObjectURL(new Blob([report], { type: "text/plain" }))}
          download={`mRNAchitect-report-${new Date().toISOString()}.txt`}
          leftSection={<DownloadSimpleIcon />}
        >
          Download (.txt format)
        </Button>
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
