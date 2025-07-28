import {
  Accordion,
  AccordionControlProps,
  ActionIcon,
  Alert,
  Button,
  Center,
  Fieldset,
  LoadingOverlay,
  Stack,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import z from "zod/v4";
import { RegionInput } from "~/components/inputs/RegionInput";
import { SequenceInput } from "~/components/inputs/SequenceInput";
import { ORGANISMS } from "~/constants";
import { analyzeSequence, optimizeSequence } from "~/server/optimize";
import { Constraint, Objective, OptimizationError } from "~/types/optimize";
import { Sequence } from "~/types/sequence";
import { ProgressLoader } from "./ProgressLoader";
import { OptimizationInput, OptimizationOutput } from "./types";

const createDefaultConstraint = (): Constraint => ({
  start: null,
  end: null,
  enableUridineDepletion: false,
  avoidRibosomeSlip: false,
  gcContentMin: 0.4,
  gcContentMax: 0.7,
  gcContentWindow: 100,
  avoidRestrictionSites: [],
  avoidSequences: [],
  avoidPolyT: 9,
  avoidPolyA: 9,
  avoidPolyC: 6,
  avoidPolyG: 6,
  hairpinStemSize: 10,
  hairpinWindow: 60,
});

const createDefaultObjective = (): Objective => ({
  start: null,
  end: null,
  organism: ORGANISMS[0].value,
  avoidRepeatLength: 10,
});

const AccordionControl = ({
  onClickDelete,
  ...props
}: { onClickDelete: () => void } & AccordionControlProps) => (
  <Center>
    <Accordion.Control {...props} />
    <ActionIcon size="lg" variant="subtle" color="red" onClick={onClickDelete}>
      <TrashIcon size={14} />
    </ActionIcon>
  </Center>
);

export const Input = () => {
  const [accordionValue, setAccordionValue] = useState<string | null>(null);

  const [numberOfSequences, setNumberOfSequences] = useState<number>(3);
  const [organism, setOrganism] = useState<string>(ORGANISMS[0].value);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [optimizationResults, setOptimizationResults] =
    useState<OptimizationOutput>();
  const [optimizationError, setOptimizationError] = useState<
    OptimizationError | string
  >();

  const form = useForm<OptimizationInput>({
    initialValues: {
      sequence: {
        codingSequenceType: "nucleic-acid",
        codingSequence: "",
        fivePrimeUTR: "",
        threePrimeUTR: "",
        polyATail: "",
      },
      constraints: [createDefaultConstraint()],
      objectives: [createDefaultObjective()],
    },
    validate: (values) => {
      const result = OptimizationInput.safeParse(values);
      console.log(result);
      if (result.success) {
        return {};
      }
      return Object.fromEntries(
        result.error.issues
          .filter((issue) => issue.path.length)
          .map((issue) => [issue.path.join("."), issue.message]),
      );
    },
  });

  const handleOnAddConstraint = () => {
    form.insertListItem("constraints", {
      start: null,
      end: null,
      enableUridineDepletion: false,
      avoidRibosomeSlip: false,
      gcContentMin: 0.4,
      gcContentMax: 0.7,
      gcContentWindow: 100,
      avoidRestrictionSites: [],
      avoidSequences: [],
      avoidPolyT: 9,
      avoidPolyA: 9,
      avoidPolyC: 6,
      avoidPolyG: 6,
      hairpinStemSize: 10,
      hairpinWindow: 60,
    });
    setAccordionValue((form.getValues().constraints.length - 1).toString());
  };

  const handleOnDeleteConstraint = (index: number) => {
    form.removeListItem("constraints", index);
  };

  const handleOptimize = async () => {
    const analyze = async (sequence: string, organism: string) => {
      if (sequence) {
        return await analyzeSequence({ data: { sequence, organism } });
      }
      return null;
    };

    const optimizeAndAnalyze = async (
      optimizationForm: OptimizationInput,
    ): Promise<OptimizationOutput["outputs"][0]> => {
      const { sequence, constraints, objectives } = optimizationForm;
      const optimization = await optimizeSequence({
        data: {
          sequence: sequence.codingSequence,
          constraints,
          objectives,
        },
      });
      if (!optimization.success) {
        throw optimization;
      }

      const cdsAnalysis = await analyzeSequence({
        data: {
          sequence: optimization.result.sequence.nucleicAcidSequence,
          organism: objectives[0].organism,
        },
      });

      const fullSequenceAnalysis = await analyzeSequence({
        data: {
          sequence: `${sequence.fivePrimeUTR}${sequence.codingSequence}${sequence.threePrimeUTR}${sequence.polyATail}`,
          organism: objectives[0].organism,
        },
      });

      return { optimization, cdsAnalysis, fullSequenceAnalysis };
    };

    const { sequence } = form.getValues();

    setIsLoading(true);
    setOptimizationResults(undefined);
    setOptimizationError(undefined);
    try {
      const [
        cdsAnalysis,
        fivePrimeUTRAnalysis,
        threePrimeUTRAnalysis,
        fullSequenceAnalysis,
        ...outputs
      ] = await Promise.all([
        analyzeSequence({
          data: { sequence: sequence.codingSequence, organism },
        }),
        analyze(sequence.fivePrimeUTR, organism),
        analyze(sequence.threePrimeUTR, organism),
        analyzeSequence({
          data: {
            sequence: `${sequence.fivePrimeUTR}${sequence.codingSequence}${sequence.threePrimeUTR}${sequence.polyATail}`,
            organism,
          },
        }),
        ...Array(numberOfSequences)
          .fill(0)
          .map(() => optimizeAndAnalyze(form.getValues())),
      ]);

      setOptimizationResults({
        input: {
          cdsAnalysis,
          fivePrimeUTRAnalysis,
          threePrimeUTRAnalysis,
          fullSequenceAnalysis,
        },
        outputs,
      });
    } catch (e) {
      console.error(e);
      setOptimizationResults(undefined);
      const error = OptimizationError.safeParse(e);
      if (error.success) {
        setOptimizationError(error.data);
      } else {
        setOptimizationError("N/A");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleOptimize)}>
      <Stack pos="relative">
        <Fieldset legend="Input sequence">
          <SequenceInput form={form} />
        </Fieldset>
        <Fieldset legend="Input optimization regions">
          <Accordion
            chevronPosition="left"
            value={accordionValue}
            onChange={setAccordionValue}
          >
            {form.getValues().constraints.map((constraint, index) => (
              <Accordion.Item key={index} value={index.toString()}>
                <AccordionControl
                  onClickDelete={() => handleOnDeleteConstraint(index)}
                >{`Region ${index + 1}`}</AccordionControl>
                <Accordion.Panel>
                  <RegionInput index={index} form={form} />
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
          <Center mt="md">
            <Button
              onClick={handleOnAddConstraint}
              variant="outline"
              color="green"
              leftSection={<PlusIcon size={14} />}
            >
              Add another region
            </Button>
          </Center>
        </Fieldset>
        {optimizationError && (
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
        )}
        <Button type="submit">Optimize</Button>

        {isLoading && (
          <LoadingOverlay
            visible={isLoading}
            zIndex={1000}
            overlayProps={{ blur: 2 }}
          >
            <ProgressLoader
              estimatedTimeInSeconds={
                (form.getValues().sequence.codingSequence.length ?? 100) / 30 +
                60
              }
            />
          </LoadingOverlay>
        )}
      </Stack>
    </form>
  );
};
