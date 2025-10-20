import { createServerFn } from "@tanstack/react-start";
import z from "zod/v4";
import {
  Analysis,
  Optimization,
  OptimizationParameter,
} from "~/types/optimize";
import { execFileAsync } from "./utils";

const SequenceAndOrganism = z.object({
  sequence: z.string().nonempty(),
  organism: z.string().nonempty(),
});

type SequenceAndOrganism = z.infer<typeof SequenceAndOrganism>;

const OptimizationRequest = z.object({
  sequence: z.string().nonempty(),
  parameters: z.array(OptimizationParameter),
});

type OptimizationRequest = z.infer<typeof OptimizationRequest>;

export const convertSequenceToNucleicAcid = createServerFn({ method: "POST" })
  .inputValidator((data: SequenceAndOrganism) =>
    SequenceAndOrganism.parse(data),
  )
  .handler(async ({ data: { sequence, organism } }) => {
    const { stdout } = await execFileAsync(
      "python",
      [
        "-m",
        "tools.cli",
        "convert",
        sequence,
        "--sequence-type",
        "amino-acid",
        "--organism",
        organism,
        "--format",
        "json",
      ],
      { shell: false, timeout: 30_000 },
    );
    return z.string().nonempty().parse(JSON.parse(stdout));
  });

export const analyzeSequence = createServerFn({ method: "POST" })
  .inputValidator((data: SequenceAndOrganism) =>
    SequenceAndOrganism.parse(data),
  )
  .handler(async ({ data: { sequence, organism } }) => {
    const { stdout } = await execFileAsync(
      "python",
      [
        "-m",
        "tools.cli",
        "analyze",
        sequence,
        "--sequence-type",
        "nucleic-acid",
        "--organism",
        organism,
        "--format",
        "json",
      ],
      { shell: false, timeout: 900_000 },
    );
    return Analysis.parse(JSON.parse(stdout));
  });

export const optimizeSequence = createServerFn({ method: "POST" })
  .inputValidator((data: OptimizationRequest) =>
    OptimizationRequest.parse(data),
  )
  .handler(async ({ data: { sequence, parameters } }) => {
    const { stdout } = await execFileAsync(
      "python",
      [
        "-m",
        "tools.cli",
        "optimize",
        sequence,
        "--sequence-type",
        "nucleic-acid",
        "--config",
        JSON.stringify(parameters),
        "--format",
        "json",
      ],
      {
        shell: false,
        timeout: 900_000,
      },
    );
    return Optimization.parse(JSON.parse(stdout));
  });
