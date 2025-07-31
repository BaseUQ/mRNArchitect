import {
  Accordion,
  type AccordionControlProps,
  ActionIcon,
  Alert,
  Button,
  Center,
  Fieldset,
  LoadingOverlay,
  NumberInput,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { OptimizationParameter } from "~/types/optimize";
import { ParameterInput } from "./inputs/ParameterInput";
import { SequenceInput } from "./inputs/SequenceInput";
import { ProgressLoader } from "./ProgressLoader";
import { OptimizationInput } from "./types";

const createDefaultParameter = (
  startCoordinate: number | null = null,
  endCoordinate: number | null = null,
): OptimizationParameter => ({
  startCoordinate,
  endCoordinate,
  organism: "human",
  avoidRepeatLength: 10,
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

const AccordionControl = ({
  onClickDelete,
  ...props
}: { onClickDelete: () => void } & AccordionControlProps) => (
  <Center>
    <Accordion.Control {...props} />
    <Tooltip label="Remove region">
      <ActionIcon size="lg" color="red" onClick={onClickDelete}>
        <TrashIcon size={20} />
      </ActionIcon>
    </Tooltip>
  </Center>
);

interface InputFormProps {
  onSubmit: (v: OptimizationInput) => Promise<void>;
}

export const InputForm = ({ onSubmit }: InputFormProps) => {
  const [accordionValue, setAccordionValue] = useState<string | null>("0");
  const [numberOfSequences, setNumberOfSequences] = useState<number>(3);

  const form = useForm<OptimizationInput>({
    initialValues: {
      sequence: {
        codingSequenceType: "nucleic-acid",
        codingSequence: "",
        fivePrimeUTR: "",
        threePrimeUTR: "",
        polyATail: "",
      },
      parameters: [createDefaultParameter()],
      numberOfSequences,
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

  const handleOnAddParameter = () => {
    const numParameters = form.getValues().parameters.length;
    const startCoordinate = numParameters ? 1 : null;
    const endCoordinate = numParameters ? 30 : null;
    form.insertListItem(
      "parameters",
      createDefaultParameter(startCoordinate, endCoordinate),
    );
    setAccordionValue((numParameters - 1).toString());
  };

  const handleOnDeleteParameter = (index: number) => {
    form.removeListItem("parameters", index);
  };

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack pos="relative">
        <Fieldset legend="Input sequence">
          <SequenceInput form={form} />
        </Fieldset>
        <Fieldset legend="Input optimisation parameter regions">
          <Accordion
            chevronPosition="left"
            value={accordionValue}
            onChange={setAccordionValue}
          >
            {form.getValues().parameters.length === 0 && (
              <Center>
                <Alert color="red">
                  <Text>At least one region must be added to optimize.</Text>
                </Alert>
              </Center>
            )}
            {form.getValues().parameters.map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: No other suitable key
              <Accordion.Item key={`${index}`} value={index.toString()}>
                <AccordionControl
                  onClickDelete={() => handleOnDeleteParameter(index)}
                >{`Region ${index + 1}`}</AccordionControl>
                <Accordion.Panel>
                  <ParameterInput index={index} form={form} />
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
          <Center mt="md">
            <Button
              onClick={handleOnAddParameter}
              variant="outline"
              color="green"
              leftSection={<PlusIcon size={14} />}
            >
              Add another parameter region
            </Button>
          </Center>
        </Fieldset>
        <Fieldset legend="Number of optimised sequences">
          <NumberInput
            min={1}
            max={10}
            value={numberOfSequences}
            onChange={(v) =>
              setNumberOfSequences(
                typeof v === "string" ? Number.parseInt(v) : v,
              )
            }
          />
        </Fieldset>
        <Button
          type="submit"
          disabled={form.getValues().parameters.length === 0}
        >
          Optimise
        </Button>
        {form.submitting && (
          <LoadingOverlay
            visible={form.submitting}
            zIndex={1000}
            overlayProps={{ blur: 2 }}
            loaderProps={{
              children: (
                <ProgressLoader
                  estimatedTimeInSeconds={
                    (form.getValues().sequence.codingSequence.length ?? 100) /
                      30 +
                    60
                  }
                />
              ),
            }}
          />
        )}
      </Stack>
    </form>
  );
};
