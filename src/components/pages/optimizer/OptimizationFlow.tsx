import { useState } from "react";
import { Stepper } from "@mantine/core";
import { OptimizationSequence } from "~/components/pages/optimizer/steps/OptimizationSequence";

export const OptimizationFlow = () => {
  const [active, setActive] = useState<number>(0);
  return (
    <Stepper active={active}>
      <Stepper.Step label="Enter sequence">
        <OptimizationSequence />
      </Stepper.Step>
      <Stepper.Step label="Set optimization parameters"></Stepper.Step>
      <Stepper.Step label="Results"></Stepper.Step>
    </Stepper>
  );
};
