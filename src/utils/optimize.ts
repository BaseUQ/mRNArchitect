import childProcess from "node:child_process";
import utils from "node:util";
import { AnalyzeResponse, type OptimizationRequest, OptimizationResponse } from "~/types/optimize";

const execFile = utils.promisify(childProcess.execFile);

export const convertSequence = async ({
  sequence,
  organism,
}: { sequence: string; organism: string }): Promise<string> => {
  const { stdout } = await execFile("python", [
    "./scripts/optimize.py",
    "convert-sequence",
    sequence,
    organism,
  ]);
  return JSON.parse(stdout);
};

export const analyzeSequence = async ({ sequence, organism }: { sequence: string, organism: string }): Promise<AnalyzeResponse> => {
  const { stdout } = await execFile(
    "python",
    [
      "./scripts/optimize.py",
      "analyze-sequence",
      sequence,
      organism
    ]
  );
  return AnalyzeResponse.parse(JSON.parse(stdout));
}

export const optimizeSequence = async (request: OptimizationRequest): Promise<OptimizationResponse> => {
  const { stdout } = await execFile(
    "python",
    [
      "./scripts/optimize.py",
      "optimize-sequence",
      "--organism",
      request.organism,
      request.avoidUridineDepletion
        ? "--avoid-uridine-depletion"
        : "--no-avoid-uridine-depletion",
      request.avoidRibosomeSlip
        ? "--avoid-ribosome-slip"
        : "--no-avoid-ribosome-slip",
      "--gc-min",
      request.minMaxGCContent[0].toString(),
      "--gc-max",
      request.minMaxGCContent[1].toString(),
      "--gc-window",
      request.gcContentWindow.toString(),
      "--avoid-restriction-sites",
      request.avoidCutSites.join(","),
      "--avoid-sequences",
      request.avoidSequences,
      "--avoid-repeat-length",
      request.avoidRepeatLength.toString(),
      "--avoid-poly-a",
      request.avoidPolyA.toString(),
      "--avoid-poly-c",
      request.avoidPolyC.toString(),
      "--avoid-poly-g",
      request.avoidPolyG.toString(),
      "--avoid-poly-t",
      request.avoidPolyU.toString(),
      "--hairpin-stem-size",
      request.hairpinStemSize.toString(),
      "--hairpin-window",
      request.hairpinWindow.toString(),
      request.sequence,
    ],
    {
      shell: true,
      timeout: 60_000,
    },
  );
  return OptimizationResponse.parse(JSON.parse(stdout));
};
