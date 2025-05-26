import { createServerFn } from "@tanstack/react-start";
import {
  AnalyzeResponse,
  OptimizationResponse,
  type OptimizationRequest,
} from "~/types/optimize";
import childProcess from "node:child_process";
import utils from "node:util";
import z from "zod";

const execFileAsync = utils.promisify(childProcess.execFile);

export const convertSequenceToNucleicAcid = createServerFn({ method: "POST" })
  .validator((data: { sequence: string; organism: string }) => data)
  .handler(async ({ data: { sequence, organism } }) => {
    const { stdout } = await execFileAsync("python", [
      "./scripts/optimize.py",
      "convert-sequence-to-nucleic-acid",
      sequence,
      organism,
    ]);
    return z.string().nonempty().parse(JSON.parse(stdout));
  });

export const analyzeSequence = createServerFn({ method: "POST" })
  .validator((data: { sequence: string; organism: string }) => data)
  .handler(async ({ data: { sequence, organism } }) => {
    const { stdout } = await execFileAsync("python", [
      "./scripts/optimize.py",
      "analyze-sequence",
      sequence,
      organism,
    ]);
    return AnalyzeResponse.parse(JSON.parse(stdout));
  });

export const optimizeSequence = createServerFn({ method: "POST" })
  .validator((data: OptimizationRequest) => data)
  .handler(async ({ data }) => {
    const { stdout } = await execFileAsync(
      "python",
      [
        "./scripts/optimize.py",
        "optimize-sequence",
        "--organism",
        data.organism,
        data.avoidUridineDepletion
          ? "--avoid-uridine-depletion"
          : "--no-avoid-uridine-depletion",
        data.avoidRibosomeSlip
          ? "--avoid-ribosome-slip"
          : "--no-avoid-ribosome-slip",
        "--gc-min",
        data.minMaxGCContent[0].toString(),
        "--gc-max",
        data.minMaxGCContent[1].toString(),
        "--gc-window",
        data.gcContentWindow.toString(),
        "--avoid-restriction-sites",
        data.avoidCutSites.join(","),
        "--avoid-sequences",
        data.avoidSequences,
        "--avoid-repeat-length",
        data.avoidRepeatLength.toString(),
        "--avoid-poly-a",
        data.avoidPolyA.toString(),
        "--avoid-poly-c",
        data.avoidPolyC.toString(),
        "--avoid-poly-g",
        data.avoidPolyG.toString(),
        "--avoid-poly-t",
        data.avoidPolyU.toString(),
        "--hairpin-stem-size",
        data.hairpinStemSize.toString(),
        "--hairpin-window",
        data.hairpinWindow.toString(),
        data.sequence,
      ],
      {
        shell: true,
        timeout: 60_000,
      },
    );
    return OptimizationResponse.parse(JSON.parse(stdout));
  });
