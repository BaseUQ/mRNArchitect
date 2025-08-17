import { Alert, Box, Modal, Stack, Tabs, Text } from "@mantine/core";
import {
  ClipboardTextIcon,
  FileIcon,
  InfoIcon,
  QuestionIcon,
  ScribbleIcon,
} from "@phosphor-icons/react";
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
import { TermsAndConditions } from "./TermsAndConditions";
import type { OptimizationInput, OptimizationOutput } from "./types";

export const OptimizePage = () => {
  const [activeTab, setActiveTab] = useState<string | null>("input");
  const [outputProps, setOutputProps] = useState<OutputProps>();
  const [optimizationError, setOptimizationError] = useState<
    OptimizationError | string
  >();

  const handleTabsOnChange = (tab: string | null) => {
    if (tab === "paper") {
      window
        ?.open(
          "https://www.biorxiv.org/content/10.1101/2024.12.03.626696v3",
          "_blank",
        )
        ?.focus();
    } else {
      setActiveTab(tab);
    }
  };

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
          sequence: `${sequence.fivePrimeUtr}${optimization.result.sequence.nucleicAcidSequence}${sequence.threePrimeUtr}${sequence.polyATail}`,
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
        fivePrimeUtrAnalysis,
        threePrimeUtrAnalysis,
        fullSequenceAnalysis,
        ...outputs
      ] = await Promise.all([
        analyzeSequence({
          data: {
            sequence: sequence.codingSequence,
            organism,
          },
        }),
        analyze(sequence.fivePrimeUtr, organism),
        analyze(sequence.threePrimeUtr, organism),
        analyzeSequence({
          data: {
            sequence: `${sequence.fivePrimeUtr}${sequence.codingSequence}${sequence.threePrimeUtr}${sequence.polyATail}`,
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
            fivePrimeUtrAnalysis,
            threePrimeUtrAnalysis,
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
    <Tabs value={activeTab} onChange={handleTabsOnChange}>
      <Tabs.List>
        <Tabs.Tab
          value="input"
          leftSection={<ScribbleIcon size={16} transform="rotate(45)" />}
        >
          Input
        </Tabs.Tab>
        <Tabs.Tab
          value="output"
          leftSection={<ClipboardTextIcon size={16} />}
          disabled={!outputProps}
        >
          Output
        </Tabs.Tab>
        <Tabs.Tab
          value="help"
          leftSection={<QuestionIcon size={16} />}
          ml="auto"
        >
          Help
        </Tabs.Tab>
        <Tabs.Tab
          value="terms-and-conditions"
          leftSection={<InfoIcon size={16} />}
        >
          Terms
        </Tabs.Tab>
        <Tabs.Tab value="paper" leftSection={<FileIcon size={16} />}>
          Paper
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
        <Tabs.Panel value="terms-and-conditions">
          <TermsAndConditions />
        </Tabs.Panel>
      </Box>
      {optimizationError && (
        <Modal opened={true} onClose={() => setOptimizationError(undefined)}>
          <Alert title="Optimisation failed" color="red">
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
