import { execFile } from "node:child_process";
import utils from "node:util";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { loggingMiddleware } from "~/global-middleware";
import {
  AnalyzeResponse,
  OptimizationRequest,
  OptimizationResponse,
} from "~/types/optimize";

const execFileAsync = utils.promisify(execFile);

const SequenceAndOrganism = z.object({
  sequence: z.string().nonempty(),
  organism: z.string().nonempty(),
});

type SequenceAndOrganism = z.infer<typeof SequenceAndOrganism>;

export const convertSequenceToNucleicAcid = createServerFn({ method: "POST" })
  .middleware([loggingMiddleware])
  .validator((data: SequenceAndOrganism) => SequenceAndOrganism.parse(data))
  .handler(async ({ data: { sequence, organism } }) => {
    const { stdout } = await execFileAsync(
      "python",
      [
        "-m",
        "tools.cli",
        "convert-sequence-to-nucleic-acid",
        sequence,
        organism,
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
      ["-m", "tools.cli", "analyze-sequence", sequence, organism],
      { shell: false, timeout: 900_000 },
    );
    return AnalyzeResponse.parse(JSON.parse(stdout));
  });

export const optimizeSequence = createServerFn({ method: "POST" })
  .middleware([loggingMiddleware])
  .validator((data: OptimizationRequest) => OptimizationRequest.parse(data))
  .handler(async ({ data }) => {
    const { stdout } = await execFileAsync(
      "python",
      [
        "-m",
        "tools.cli",
        "optimize-sequence",
        data.sequence,
        JSON.stringify(data),
      ],
      {
        shell: false,
        timeout: 900_000,
      },
    );
    return OptimizationResponse.parse(JSON.parse(stdout));
  });
