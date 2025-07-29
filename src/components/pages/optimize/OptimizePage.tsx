import { Alert, Box, Modal, Stack, Tabs, Text } from "@mantine/core";
import { DnaIcon, FileIcon, QuestionIcon } from "@phosphor-icons/react";
import { useState } from "react";
import {
  analyzeSequence,
  convertSequenceToNucleicAcid,
  optimizeSequence,
} from "~/server/optimize";
import { OptimizationError } from "~/types/optimize";
import { Help } from "./Help";
import { InputForm } from "./InputForm";
import { Output, type OutputProps } from "./Output";
import type { OptimizationInput, OptimizationOutput } from "./types";

export const OptimizePage = () => {
  const [activeTab, setActiveTab] = useState<string | null>("input");
  const [outputProps, setOutputProps] = useState<OutputProps>();
  const [optimizationError, setOptimizationError] = useState<
    OptimizationError | string
  >();

  const handleOnSubmit = async (values: OptimizationInput) => {
    const parseInput = async (
      optimizationInput: OptimizationInput,
    ): Promise<OptimizationInput> => {
      let codingSequence = optimizationInput.sequence.codingSequence;
      if (optimizationInput.sequence.codingSequenceType === "amino-acid") {
        codingSequence = await convertSequenceToNucleicAcid({
          data: { sequence: codingSequence, organism: "human" },
        });
      }
      return {
        ...optimizationInput,
        sequence: {
          ...optimizationInput.sequence,
          codingSequenceType: "nucleic-acid",
          codingSequence,
        },
      };
    };

    const analyze = async (sequence: string, organism: string) => {
      if (sequence) {
        return await analyzeSequence({ data: { sequence, organism } });
      }
      return null;
    };

    const optimizeAndAnalyze = async (
      optimizationForm: OptimizationInput,
    ): Promise<OptimizationOutput["outputs"][0]> => {
      const { sequence, parameters } = optimizationForm;
      const optimization = await optimizeSequence({
        data: {
          sequence: sequence.codingSequence,
          parameters,
        },
      });
      if (!optimization.success) {
        throw optimization;
      }

      const cdsAnalysis = await analyzeSequence({
        data: {
          sequence: optimization.result.sequence.nucleicAcidSequence,
          organism: parameters[0].organism,
        },
      });

      const fullSequenceAnalysis = await analyzeSequence({
        data: {
          sequence: `${sequence.fivePrimeUTR}${optimization.result.sequence.nucleicAcidSequence}${sequence.threePrimeUTR}${sequence.polyATail}`,
          organism: parameters[0].organism,
        },
      });

      return { optimization, cdsAnalysis, fullSequenceAnalysis };
    };

    setOutputProps(undefined);
    setOptimizationError(undefined);
    try {
      const formValues = await parseInput(values);
      const { sequence, parameters, numberOfSequences } = formValues;
      const organism = parameters[0].organism;

      const [
        cdsAnalysis,
        fivePrimeUTRAnalysis,
        threePrimeUTRAnalysis,
        fullSequenceAnalysis,
        ...outputs
      ] = await Promise.all([
        analyzeSequence({
          data: {
            sequence: sequence.codingSequence,
            organism,
          },
        }),
        analyze(sequence.fivePrimeUTR, organism),
        analyze(sequence.threePrimeUTR, organism),
        analyzeSequence({
          data: {
            sequence: `${sequence.fivePrimeUTR}${sequence.codingSequence}${sequence.threePrimeUTR}${sequence.polyATail}`,
            organism: organism,
          },
        }),
        ...Array(numberOfSequences)
          .fill(0)
          .map(() => optimizeAndAnalyze(formValues)),
      ]);

      setOutputProps({
        input: formValues,
        output: {
          input: {
            cdsAnalysis,
            fivePrimeUTRAnalysis,
            threePrimeUTRAnalysis,
            fullSequenceAnalysis,
          },
          outputs,
        },
      });
      setActiveTab("output");
    } catch (e) {
      console.error(e);
      setOutputProps(undefined);
      const error = OptimizationError.safeParse(e);
      if (error.success) {
        setOptimizationError(error.data);
      } else {
        setOptimizationError("N/A");
      }
    } finally {
    }
  };

  return (
    <Tabs value={activeTab} onChange={setActiveTab}>
      <Tabs.List>
        <Tabs.Tab value="input" leftSection={<DnaIcon size={12} />}>
          Input
        </Tabs.Tab>
        <Tabs.Tab
          value="output"
          leftSection={<FileIcon size={12} />}
          disabled={!outputProps}
        >
          Output
        </Tabs.Tab>
        <Tabs.Tab
          value="help"
          leftSection={<QuestionIcon size={12} />}
          ml="auto"
        >
          Help
        </Tabs.Tab>
      </Tabs.List>
      <Box pt="md">
        <Tabs.Panel value="input">
          <InputForm onSubmit={handleOnSubmit} />
        </Tabs.Panel>
        <Tabs.Panel value="output">
          {outputProps && <Output {...outputProps} />}
        </Tabs.Panel>
        <Tabs.Panel value="help">
          <Help />
        </Tabs.Panel>
      </Box>
      {optimizationError && (
        <Modal opened={true} onClose={() => setOptimizationError(undefined)}>
          <Alert title="Optimization failed" color="red">
            Error resolving constraints. Sequence cannot be optimised. Please
            verify your input sequence or adjust input parameters (e.g. increase
            GC content/window).
            <Stack ff="monospace">
              {typeof optimizationError === "string"
                ? optimizationError
                : optimizationError.error.message
                    .split("\n")
                    .map((v) => <Text key={v}>{v}</Text>)}
            </Stack>
          </Alert>
        </Modal>
      )}
    </Tabs>
  );
};
