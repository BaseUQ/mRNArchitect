import { useState } from "react";
import { Button, Group, Stack, Stepper } from "@mantine/core";
import { Sequence } from "~/types/sequence";
import {
  ConstraintModal,
  ConstraintRow,
} from "~/components/forms/optimization/ConstraintsForm";
import {
  SequenceModal,
  SequenceRow,
} from "~/components/forms/optimization/SequenceForm";
import {
  OptimizationResults,
  OptimizationResultsProps,
} from "./steps/OptimizationResults";
import { Constraint, Objective } from "~/types/optimize";
import { analyzeSequence, optimizeSequence } from "~/server/optimize";

export const OptimizationFlow = () => {
  const [active, setActive] = useState<number>(0);

  const [sequenceModalOpened, setSequenceModalOpened] =
    useState<boolean>(false);
  const [sequence, setSequence] = useState<Sequence>();

  const [constraintModalOpened, setConstraintModalOpened] =
    useState<boolean>(false);
  const [constraints, setConstraints] = useState<Constraint[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [optimizationResults, setOptimizationResults] =
    useState<OptimizationResultsProps["results"]>();
  const [optimizationError, setOptimizationError] = useState<string>();

  // TODO: make number of sequences user defined
  const numberOfSequences = 3;

  // TODO: Make objectives user defined
  const objectives: Objective[] = [
    {
      start: null,
      end: null,
      organism: "human",
      avoidRepeatLength: 10,
    },
  ];

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
    const organism = objectives.at(0)?.organism;
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Stack>
      <Stepper active={active}>
        <Stepper.Step label="Input sequence">
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
              <Button onClick={() => setSequenceModalOpened(true)}>
                Add new sequence
              </Button>
            </>
          )}
        </Stepper.Step>
        <Stepper.Step label="Set optimization parameters">
          <Stack>
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
                constraint={constraint}
                editable
                onSave={(c) => handleOnSaveConstraint(index, c)}
                onDelete={() => handleOnDeleteConstraint(index)}
              />
            ))}
            <Button onClick={() => setConstraintModalOpened(true)}>
              Add new constraint
            </Button>
          </Stack>
        </Stepper.Step>
        <Stepper.Step label="Results" loading={isLoading}>
          {optimizationResults && (
            <OptimizationResults
              sequence={sequence!}
              constraints={constraints}
              objectives={objectives}
              results={optimizationResults}
            />
          )}
          {!optimizationResults && isLoading && <div>Loading...</div>}
          {optimizationError && <div>{optimizationError}</div>}
        </Stepper.Step>
      </Stepper>
      <Group grow>
        <Button
          onClick={() => setActive(active - 1)}
          disabled={active === 0}
          variant="outline"
        >
          Back
        </Button>
        <Button onClick={handleOnClickNext} disabled={nextButtonIsDisabled()}>
          Next
        </Button>
      </Group>
    </Stack>
  );
};
