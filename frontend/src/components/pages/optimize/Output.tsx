import { Button, Card, Group, Stack, Text } from "@mantine/core";
import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { format } from "date-fns";
import { useMemo } from "react";
import { Fragment } from "react/jsx-runtime";
import type { OptimizationParameter } from "~/api";
import type { Sequence } from "~/types/sequence";
import { aminoAcidLength, nucleotideLength } from "~/utils/sequence";
import type { OptimizationInput, OptimizationOutput } from "./types";

const parameterTitle = (
  sequence: Sequence,
  parameter: OptimizationParameter,
): string => {
  const start = parameter.start_coordinate ?? 1;
  const end = parameter.end_coordinate ?? nucleotideLength(sequence);
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
    `Full Length (nt)\t${nucleotideLength(sequence, true)}`,
    `CDS Length (aa)\t\t${aminoAcidLength(sequence)}`,
    `CDS Length (nt)\t\t${nucleotideLength(sequence)}`,
    `CDS\t\t\t${sequence.codingSequence}`,
    `5' UTR\t\t\t${sequence.fivePrimeUtr}`,
    `3' UTR\t\t\t${sequence.threePrimeUtr}`,
    `Poly(A) tail\t\t${sequence.polyATail}`,
  ];

  const parameterReports = parameters
    .map((c) => {
      const report: string[] = [
        `---${parameterTitle(sequence, c)}`,
        `Start coordinate\t\t\t${c.start_coordinate || "1"}`,
        `End coordinate\t\t\t\t${c.end_coordinate || output.outputs[0].optimization.result.sequence.nucleic_acid_sequence.length}`,
        `Don't optimise region\t\t\t${c.enforce_sequence}`,
      ];
      if (!c.enforce_sequence) {
        report.push(
          ...[
            //`Optimise CAI\t\t\t\t${c.optimizeCai}`,
            //`Optimise tAI\t\t\t\t${c.optimizeTai}`,
            `Organism\t\t\t\t${c.codon_usage_table}`,
            `Avoid repeat length\t\t\t${c.avoid_repeat_length}`,
            `Enable uridine depletion\t\t${c.enable_uridine_depletion}`,
            `Avoid ribosome slip\t\t\t${c.avoid_ribosome_slip}`,
            `Avoid manufacture restriction sites\t${c.avoid_manufacture_restriction_sites}`,
            `Avoid microRNA seed sites\t\t${c.avoid_micro_rna_seed_sites}`,
            `GC content global minimum\t\t${c.gc_content_global_min}`,
            `GC content global maximum\t\t${c.gc_content_global_max}`,
            `GC content window minimum\t\t${c.gc_content_window_min}`,
            `GC content window maximum\t\t${c.gc_content_window_max}`,
            `GC content window size\t\t\t${c.gc_content_window_size}`,
            `Avoid cut sites\t\t\t\t${c.avoid_restriction_sites}`,
            `Avoid sequences\t\t\t\t${c.avoid_sequences}`,
            `Avoid poly(U)\t\t\t\t${c.avoid_poly_t}`,
            `Avoid poly(A)\t\t\t\t${c.avoid_poly_a}`,
            `Avoid poly(C)\t\t\t\t${c.avoid_poly_c}`,
            `Avoid poly(G)\t\t\t\t${c.avoid_poly_g}`,
            `Hairpin stem size\t\t\t${c.hairpin_stem_size}`,
            `Hairpin window\t\t\t\t${c.hairpin_window}`,
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
      `CDS:\t\t\t${optimization.result.sequence.nucleic_acid_sequence}`,
      "",
      `Full-length mRNA:\t${sequence.fivePrimeUtr + optimization.result.sequence.nucleic_acid_sequence + sequence.threePrimeUtr + sequence.polyATail}`,
      "",
      "---Results",
      "Metric\t\t\tInput\tOptimised",
      `A ratio\t\t\t${output.input.cdsAnalysis.a_ratio.toFixed(2)}\t${cdsAnalysis.a_ratio.toFixed(2)}`,
      `T/U ratio\t\t${output.input.cdsAnalysis.t_ratio.toFixed(2)}\t${cdsAnalysis.t_ratio.toFixed(2)}`,
      `G ratio\t\t\t${output.input.cdsAnalysis.g_ratio.toFixed(2)}\t${cdsAnalysis.g_ratio.toFixed(2)}`,
      `C ratio\t\t\t${output.input.cdsAnalysis.c_ratio.toFixed(2)}\t${cdsAnalysis.c_ratio.toFixed(2)}`,
      `AT ratio\t\t${output.input.cdsAnalysis.at_ratio.toFixed(2)}\t${cdsAnalysis.at_ratio.toFixed(2)}`,
      `GA ratio\t\t${output.input.cdsAnalysis.ga_ratio.toFixed(2)}\t${cdsAnalysis.ga_ratio.toFixed(2)}`,
      `GC ratio\t\t${output.input.cdsAnalysis.gc_ratio.toFixed(2)}\t${cdsAnalysis.gc_ratio.toFixed(2)}`,
      `Uridine depletion\t${output.input.cdsAnalysis.uridine_depletion?.toFixed(2) ?? "-"}\t${cdsAnalysis.uridine_depletion?.toFixed(2) ?? "-"}`,
      `CAI\t\t\t${output.input.cdsAnalysis.codon_adaptation_index?.toFixed(2) ?? "-"}\t${cdsAnalysis.codon_adaptation_index?.toFixed(2) ?? "-"}`,
      `tAI\t\t\t${output.input.cdsAnalysis.trna_adaptation_index?.toFixed(2) ?? "-"}\t${cdsAnalysis.trna_adaptation_index?.toFixed(2) ?? "-"}`,
      `CDS MFE (kcal/mol)\t${output.input.cdsAnalysis.minimum_free_energy.energy.toFixed(2)}\t${cdsAnalysis.minimum_free_energy.energy.toFixed(2)}`,
      `5' UTR MFE (kcal/mol)\t${output.input.fivePrimeUtrAnalysis?.minimum_free_energy.energy.toFixed(2) ?? "-"}\t${output.input.fivePrimeUtrAnalysis?.minimum_free_energy.energy.toFixed(2) ?? "-"}`,
      `3' UTR MFE (kcal/mol)\t${output.input.threePrimeUtrAnalysis?.minimum_free_energy.energy.toFixed(2) ?? "-"}\t${output.input.threePrimeUtrAnalysis?.minimum_free_energy.energy.toFixed(2) ?? "-"}`,
      `Total MFE (kcal/mol)\t${output.input.fullSequenceAnalysis?.minimum_free_energy.energy.toFixed(2) ?? "-"}\t${fullSequenceAnalysis?.minimum_free_energy.energy.toFixed(2) ?? "-"}`,
      `Total Structure\t\t${output.input.fullSequenceAnalysis.minimum_free_energy.structure}`,
      `Total Paired nt Ratio\t${output.input.fullSequenceAnalysis.minimum_free_energy.paired_nt_ratio.toFixed(2)}`,
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
