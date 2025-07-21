import {
  Alert,
  Button,
  Center,
  Fieldset,
  Group,
  InputWrapper,
  NumberInput,
  SegmentedControl,
  Stack,
  Stepper,
  Text,
} from "@mantine/core";
import { PlusIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import {
  ConstraintModal,
  ConstraintRow,
} from "~/components/forms/optimization/ConstraintsForm";
import {
  SequenceModal,
  SequenceRow,
} from "~/components/forms/optimization/SequenceForm";
import { ORGANISMS } from "~/constants";
import { analyzeSequence, optimizeSequence } from "~/server/optimize";
import type { Constraint, Objective } from "~/types/optimize";
import type { Sequence } from "~/types/sequence";
import { ProgressLoader } from "./ProgressLoader";
import {
  OptimizationResults,
  type OptimizationResultsProps,
} from "./steps/OptimizationResults";

export const OptimizationFlow = () => {
  const [active, setActive] = useState<number>(0);

  const [sequenceModalOpened, setSequenceModalOpened] =
    useState<boolean>(false);
  const [sequence, setSequence] = useState<Sequence>();

  const [constraintModalOpened, setConstraintModalOpened] =
    useState<boolean>(false);
  const [constraints, setConstraints] = useState<Constraint[]>([]);

  const [numberOfSequences, setNumberOfSequences] = useState<number>(3);
  const [organism, setOrganism] = useState<string>(ORGANISMS[0].value);
  const [avoidRepeatLength, setAvoidRepeatLength] = useState<number>(10);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [optimizationResults, setOptimizationResults] =
    useState<OptimizationResultsProps["results"]>();
  const [optimizationError, setOptimizationError] = useState<string>();

  const objectives = useMemo<Objective[]>(
    () => [
      {
        start: null,
        end: null,
        organism,
        avoidRepeatLength,
      },
    ],
    [organism, avoidRepeatLength],
  );

  const handleOnSaveSequence = (sequence: Sequence) => {
    setSequenceModalOpened(false);
    setSequence(sequence);
  };

  const handleOnSaveConstraint = (index: number, constraint: Constraint) => {
    const newConstraints = [...constraints];
    newConstraints[index] = constraint;
    setConstraints(newConstraints);
    setConstraintModalOpened(false);
  };

  const handleOnDeleteConstraint = (index: number) => {
    const newConstraints = [...constraints];
    newConstraints.splice(index, 1);
    setConstraints(newConstraints);
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
      sequence: Sequence,
      constraints: Constraint[],
      objectives: Objective[],
    ): Promise<OptimizationResultsProps["results"]["outputs"][0]> => {
      const optimization = await optimizeSequence({
        data: {
          sequence: sequence.codingSequence,
          constraints,
          objectives,
        },
      });

      const cdsAnalysis = await analyzeSequence({
        data: {
          sequence: optimization.output.nucleic_acid_sequence,
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
          .map(() => optimizeAndAnalyze(sequence, constraints, objectives)),
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
      setOptimizationError(
        "Error resolving constraints. Sequence cannot be optimised. Please verify your input sequence or adjust input parameters (e.g. increase GC content/window).",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Stack>
      <Stepper active={active}>
        <Stepper.Step label="Input sequence">
          <Fieldset legend="Sequence">
            {sequence && (
              <SequenceRow
                sequence={sequence}
                onSave={handleOnSaveSequence}
                onDelete={() => setSequence(undefined)}
              />
            )}
            {!sequence && (
              <>
                <SequenceModal
                  opened={sequenceModalOpened}
                  onClose={() => setSequenceModalOpened(false)}
                  onSave={handleOnSaveSequence}
                />
                <Center p="xl">
                  <Button
                    onClick={() => setSequenceModalOpened(true)}
                    variant="outline"
                    color="green"
                    leftSection={<PlusIcon size={14} />}
                  >
                    Add sequence
                  </Button>
                </Center>
              </>
            )}
          </Fieldset>
        </Stepper.Step>
        <Stepper.Step label="Set optimization parameters">
          <Stack>
            <Fieldset legend="Objectives">
              <Stack>
                <NumberInput
                  label="Number of output sequences"
                  description="The number of sequence optimizations to run."
                  value={numberOfSequences}
                  onChange={(v) =>
                    setNumberOfSequences(
                      typeof v === "string" ? Number.parseInt(v) : v,
                    )
                  }
                  min={1}
                  max={10}
                />
                <InputWrapper
                  label="Organism"
                  description="Select the target organism to be used for codon optimisation. The mRNA will be optimised using the preferred codon usage of highly expressed genes in this selected organism (1). By default, we use human codon optimisation."
                >
                  <SegmentedControl
                    data={ORGANISMS}
                    value={organism}
                    onChange={setOrganism}
                    mt="sm"
                  />
                </InputWrapper>
                <NumberInput
                  label="Avoid repeat length"
                  description="Avoid repeating any sequences longer than this length within the mRNA. We recommend 10 nucleotides."
                  value={avoidRepeatLength}
                  onChange={(v) =>
                    setAvoidRepeatLength(
                      typeof v === "string" ? Number.parseInt(v) : v,
                    )
                  }
                />
              </Stack>
            </Fieldset>
            <Fieldset legend="Constraints">
              {constraintModalOpened && (
                <ConstraintModal
                  opened={constraintModalOpened}
                  onClose={() => setConstraintModalOpened(false)}
                  onSave={(c) => handleOnSaveConstraint(constraints.length, c)}
                  onCancel={() => setConstraintModalOpened(false)}
                />
              )}
              {constraints.map((constraint, index) => (
                <ConstraintRow
                  key="constraint"
                  constraint={constraint}
                  editable
                  onSave={(c) => handleOnSaveConstraint(index, c)}
                  onDelete={() => handleOnDeleteConstraint(index)}
                />
              ))}
              {constraints.length === 0 && (
                <Center>
                  <Text>At least one constraint is recommended.</Text>
                </Center>
              )}
              <Center mt="md">
                <Button
                  onClick={() => setConstraintModalOpened(true)}
                  variant="outline"
                  color="green"
                  leftSection={<PlusIcon size={14} />}
                >
                  Add constraint
                </Button>
              </Center>
            </Fieldset>
          </Stack>
        </Stepper.Step>
        <Stepper.Step label="Results" loading={isLoading}>
          {sequence && optimizationResults && (
            <OptimizationResults
              sequence={sequence}
              constraints={constraints}
              objectives={objectives}
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
              {optimizationError}
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
