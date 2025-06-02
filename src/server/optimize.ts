import childProcess from "node:child_process";
import utils from "node:util";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import {
  AnalyzeResponse,
  type OptimizationRequest,
  OptimizationResponse,
} from "~/types/optimize";

const execFileAsync = utils.promisify(childProcess.execFile);

export const convertSequenceToNucleicAcid = createServerFn({ method: "POST" })
  .validator((data: { sequence: string; organism: string }) => data)
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
      { shell: true, timeout: 5_000 },
    );
    return z.string().nonempty().parse(JSON.parse(stdout));
  });

export const analyzeSequence = createServerFn({ method: "POST" })
  .validator((data: { sequence: string; organism: string }) => data)
  .handler(async ({ data: { sequence, organism } }) => {
    const { stdout } = await execFileAsync(
      "python",
      ["-m", "tools.cli", "analyze-sequence", sequence, organism],
      { shell: false, timeout: 300_000 },
    );
    return AnalyzeResponse.parse(JSON.parse(stdout));
  });

export const optimizeSequence = createServerFn({ method: "POST" })
  .validator((data: OptimizationRequest) => data)
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
        timeout: 300_000,
      },
    );
    return OptimizationResponse.parse(JSON.parse(stdout));
  });
