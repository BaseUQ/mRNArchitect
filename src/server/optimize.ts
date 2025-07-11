import { execFile } from "node:child_process";
import utils from "node:util";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { loggingMiddleware } from "~/global-middleware";
import {
  AnalyzeResponse,
  OptimizationConstraint,
  OptimizationObjective,
  OptimizationResponse,
} from "~/types/optimize";

const execFileAsync = utils.promisify(execFile);

const SequenceAndOrganism = z.object({
  sequence: z.string().nonempty(),
  organism: z.string().nonempty(),
});

type SequenceAndOrganism = z.infer<typeof SequenceAndOrganism>;

const OptimizationRequest = z.object({
  sequence: z.string().nonempty(),
  constraints: z.array(OptimizationConstraint),
  objectives: z.array(OptimizationObjective),
});

type OptimizationRequest = z.infer<typeof OptimizationRequest>;

export const convertSequenceToNucleicAcid = createServerFn({ method: "POST" })
  .middleware([loggingMiddleware])
  .validator((data: SequenceAndOrganism) => SequenceAndOrganism.parse(data))
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
      { shell: false, timeout: 5_000 },
    );
    return z.string().nonempty().parse(JSON.parse(stdout));
  });

export const analyzeSequence = createServerFn({ method: "POST" })
  .middleware([loggingMiddleware])
  .validator((data: SequenceAndOrganism) => SequenceAndOrganism.parse(data))
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
    return AnalyzeResponse.parse(JSON.parse(stdout));
  });

export const optimizeSequence = createServerFn({ method: "POST" })
  .middleware([loggingMiddleware])
  .validator((data: OptimizationRequest) => OptimizationRequest.parse(data))
  .handler(async ({ data: { sequence, constraints, objectives } }) => {
    const { stdout } = await execFileAsync(
      "python",
      [
        "-m",
        "tools.cli",
        "optimize",
        sequence,
        "--sequence-type",
        "nucleic-acid",
        "--constraints",
        JSON.stringify(constraints),
        "--objectives",
        JSON.stringify(objectives),
        "--format",
        "json",
      ],
      {
        shell: false,
        timeout: 900_000,
      },
    );
    return OptimizationResponse.parse(JSON.parse(stdout));
  });
