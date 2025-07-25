import { Fieldset, NativeSelect, NumberInput, Stack } from "@mantine/core";
import { ORGANISMS } from "~/constants";
import type { Objective } from "~/types/optimize";

export interface ObjectiveFormProps {
  objective: Objective;
  onChange: (o: Objective) => void;
}

export const ObjectiveForm = ({ objective, onChange }: ObjectiveFormProps) => {
  return (
    <Fieldset legend="Objectives">
      <Stack>
        <NativeSelect
          label="Organism"
          description={
            "Select the target organism to be used for codon optimisation. The mRNA will be optimised using the preferred codon usage of highly expressed genes in this selected organism (1). By default, we use human codon optimisation."
          }
          data={ORGANISMS}
          value={objective.organism}
          onChange={(v) =>
            onChange({ ...objective, organism: v.currentTarget.value })
          }
        />
        <NumberInput
          label="Avoid repeat length"
          description={
            "Avoid repeating any sequences longer than this length within the mRNA. We recommend 10 nucleotides."
          }
          min={6}
          step={1}
          value={objective.avoidRepeatLength}
          onChange={(v) =>
            onChange({
              ...objective,
              avoidRepeatLength: typeof v === "string" ? Number.parseInt(v) : v,
            })
          }
        />
      </Stack>
    </Fieldset>
  );
};
