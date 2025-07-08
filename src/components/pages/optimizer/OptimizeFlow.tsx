import { useState } from "react";
import { Stepper } from "@mantine/core";
import { SequenceInput } from "~/components/inputs/SequenceInput";

export const OptimizeFlow = () => {
  const [active, setActive] = useState<number>(0);
  return (
    <Stepper active={active}>
      <Stepper.Step label="Enter sequence">
        <SequenceInput />
      </Stepper.Step>
      <Stepper.Step label="Set optimization parameters"></Stepper.Step>
      <Stepper.Step label="Results"></Stepper.Step>
    </Stepper>
  );
};
