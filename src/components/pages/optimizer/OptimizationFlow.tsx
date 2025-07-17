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
import { Constraint } from "~/types/optimize";

export const OptimizationFlow = () => {
  const [active, setActive] = useState<number>(0);

  const [sequenceModalOpened, setSequenceModalOpened] =
    useState<boolean>(false);
  const [sequence, setSequence] = useState<Sequence>();

  const [constraintModalOpened, setConstraintModalOpened] =
    useState<boolean>(false);
  const [constraints, setConstraints] = useState<Constraint[]>([]);

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
    if (active === 0) {
      // Input sequence
      return !sequence;
    }
    if (active === 1) {
      // Set constraints
      return constraints.length === 0;
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
        <Stepper.Step label="Results"></Stepper.Step>
      </Stepper>
      <Group grow>
        <Button
          onClick={() => setActive(active - 1)}
          disabled={active === 0}
          variant="outline"
        >
          Back
        </Button>
        <Button
          onClick={() => setActive(active + 1)}
          disabled={nextButtonIsDisabled()}
        >
          Next
        </Button>
      </Group>
    </Stack>
  );
};
