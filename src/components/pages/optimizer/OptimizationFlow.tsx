import {
  Accordion,
  ActionIcon,
  Alert,
  Button,
  Center,
  Fieldset,
  Group,
  Stack,
  Stepper,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { ConstraintInput } from "~/components/forms/optimization/ConstraintsForm";
import { SequenceInput } from "~/components/forms/optimization/SequenceForm";
import { ORGANISMS } from "~/constants";
import { analyzeSequence, optimizeSequence } from "~/server/optimize";
import { Constraint, Objective, OptimizationError } from "~/types/optimize";
import type { Sequence } from "~/types/sequence";
import {
  OptimizationResults,
  type OptimizationResultsProps,
} from "./OptimizationResults";
import { ProgressLoader } from "./ProgressLoader";

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

interface OptimizationForm {
  sequence: Sequence;
  constraints: Constraint[];
  objectives: Objective[];
}

export const OptimizationFlow = () => {
  const [active, setActive] = useState<number>(0);

  const [sequence, setSequence] = useState<Sequence>({
    codingSequenceType: "nucleic-acid",
    codingSequence: "",
    fivePrimeUTR: "",
    threePrimeUTR: "",
    polyATail: "",
  });

  const [constraints, setConstraints] = useState<Constraint[]>([]);

  const [numberOfSequences, setNumberOfSequences] = useState<number>(3);
  const [organism, setOrganism] = useState<string>(ORGANISMS[0].value);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [optimizationResults, setOptimizationResults] =
    useState<OptimizationResultsProps["results"]>();
  const [optimizationError, setOptimizationError] = useState<
    OptimizationError | string
  >();

  const form = useForm<OptimizationForm>({
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
      const result = Constraint.safeParse(values);
      if (!result.error) {
        return {};
      }
      return Object.fromEntries(
        result.error.issues
          .filter((issue) => issue.path.length)
          .map((issue) => [issue.path[0], issue.message]),
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
  };

  const handleOnDeleteConstraint = (index: number) => {
    form.removeListItem("constraints", index);
  };

  const nextButtonIsDisabled = () => {
    if (isLoading) {
      return true;
    }
    if (active === 0) {
      // Input sequence
      // Sequence must not be empty
      return !sequence;
    }
    if (active === 1) {
      // Set constraints
      // Must have at least 1 constraint
      return constraints.length === 0;
    }
  };

  const handleOnClickNext = () => {
    if (active === 1) {
      // Run optimization
      handleOptimize();
    }
    setActive(active + 1);
  };

  const handleOptimize = async () => {
    if (!sequence) {
      return;
    }
    if (!organism) {
      return;
    }
    const analyze = async (sequence: string, organism: string) => {
      if (sequence) {
        return await analyzeSequence({ data: { sequence, organism } });
      }
      return null;
    };

    const optimizeAndAnalyze = async (
      optimizationForm: OptimizationForm,
    ): Promise<OptimizationResultsProps["results"]["outputs"][0]> => {
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
    <Stack>
      <Stepper active={active}>
        <Stepper.Step label="Input sequence">
          <Stack>
            <Fieldset legend="Input sequence">
              <SequenceInput form={form} />
            </Fieldset>
            <Fieldset legend="Optimization regions">
              <Accordion defaultValue={"0"}>
                {form.getValues().constraints.map((constraint, index) => (
                  <Accordion.Item key={index} value={index.toString()}>
                    <Accordion.Control>{`Region ${index + 1}`}</Accordion.Control>
                    <Accordion.Panel>
                      <ActionIcon
                        color="red"
                        onClick={() => handleOnDeleteConstraint(index)}
                      >
                        <TrashIcon size={14} />
                      </ActionIcon>
                      <ConstraintInput index={index} form={form} />
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
                  Add constraint
                </Button>
              </Center>
            </Fieldset>
            <Button onClick={handleOptimize}>Optimize</Button>
          </Stack>
        </Stepper.Step>
        <Stepper.Step label="Results" loading={isLoading}>
          {sequence && optimizationResults && (
            <OptimizationResults
              sequence={form.getValues().sequence}
              constraints={form.getValues().constraints}
              objectives={form.getValues().objectives}
              results={optimizationResults}
            />
          )}
          {!optimizationResults && isLoading && (
            <ProgressLoader
              estimatedTimeInSeconds={
                (sequence?.codingSequence.length ?? 100) / 30 + 60
              }
            />
          )}
          {optimizationError && (
            <Alert title="Optimization failed" color="red">
              Error resolving constraints. Sequence cannot be optimised. Please
              verify your input sequence or adjust input parameters (e.g.
              increase GC content/window).
              <Stack ff="monospace">
                {typeof optimizationError === "string"
                  ? optimizationError
                  : optimizationError.error.message
                      .split("\n")
                      .map((v) => <Text key={v}>{v}</Text>)}
              </Stack>
            </Alert>
          )}
        </Stepper.Step>
      </Stepper>
      {!isLoading && (
        <Group grow>
          {active > 0 && (
            <Button onClick={() => setActive(active - 1)} variant="outline">
              Back
            </Button>
          )}
          {active < 2 && (
            <Button
              onClick={handleOnClickNext}
              disabled={nextButtonIsDisabled()}
            >
              Next
            </Button>
          )}
        </Group>
      )}
    </Stack>
  );
};
