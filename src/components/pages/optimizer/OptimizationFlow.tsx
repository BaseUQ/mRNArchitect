import { useState } from "react";
import { Button, Group, Stack, Stepper } from "@mantine/core";
import { Sequence } from "~/types/sequence";
import { ConstraintsForm } from "~/components/forms/optimization/ConstraintsForm";
import { SequenceForm } from "~/components/forms/optimization/SequenceForm";
import { Constraint } from "~/types/optimize";

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

  const handleOnSubmitSequence = (s: Sequence) => {
    setSequence(s);
    setActive(1);
  };

  const handleOnSubmitConstraints = (c: Constraint[]) => {
    setConstraints(constraints);
    setActive(2);
  };

  return (
    <Stack>
      <Stepper active={active}>
        <Stepper.Step label="Input sequence">
          <SequenceForm
            initialSequence={sequence}
            onSubmit={handleOnSubmitSequence}
          />
        </Stepper.Step>
        <Stepper.Step label="Set optimization parameters">
          <ConstraintsForm
            initialConstraints={constraints}
            onSubmit={handleOnSubmitConstraints}
          />
        </Stepper.Step>
        <Stepper.Step label="Results"></Stepper.Step>
      </Stepper>
    </Stack>
  );
};
