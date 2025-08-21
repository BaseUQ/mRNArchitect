import {
  Accordion,
  type AccordionControlProps,
  ActionIcon,
  Alert,
  Box,
  Button,
  Center,
  Divider,
  Fieldset,
  LoadingOverlay,
  NumberInput,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { OptimizationParameter } from "~/types/optimize";
import type { Sequence } from "~/types/sequence";
import { nucleotideCDSLength } from "~/utils/sequence";
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
  enforceSequence: false,
  organism: "human",
  avoidRepeatLength: 10,
  enableUridineDepletion: false,
  avoidRibosomeSlip: false,
  avoidManufactureRestrictionSites: false,
  avoidMicroRnaSeedSites: false,
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

const parameterTitle = (
  sequence: Sequence,
  parameter: OptimizationParameter,
) => {
  const start = parameter.startCoordinate ?? 1;
  const end = parameter.endCoordinate ?? nucleotideCDSLength(sequence);
  return `Region [${start}-${end}]`;
};

const checkSequence = (v: OptimizationInput) => {
  const { codingSequence, codingSequenceType } = v.sequence;
  const aaStopCodonMissing =
    codingSequenceType === "amino-acid" && !codingSequence.endsWith("*");
  const naStopCodonMissing =
    codingSequenceType === "nucleic-acid" &&
    codingSequence.search("(TGA|TAA|TAG)$") === -1;
  if (aaStopCodonMissing || naStopCodonMissing) {
    return (
      <Alert color="orange">
        The sequence does not end with a stop codon ('*' for amino acid
        sequences, and 'TGA', 'TAA' or 'TAG' for nucleotide sequences).
        Sequences that lack a stop codon may change the protein's function.
      </Alert>
    );
  }
};

const AccordionControl = ({
  showDelete,
  onClickDelete,
  ...props
}: {
  showDelete: boolean;
  onClickDelete: () => void;
} & AccordionControlProps) => (
  <Center>
    <Accordion.Control {...props} />
    {showDelete && (
      <Tooltip label="Remove region">
        <ActionIcon size="lg" color="red" onClick={onClickDelete}>
          <TrashIcon size={20} />
        </ActionIcon>
      </Tooltip>
    )}
  </Center>
);

interface InputFormProps {
  onSubmit: (v: OptimizationInput) => Promise<void>;
}

export const InputForm = ({ onSubmit }: InputFormProps) => {
  const [optimisationMode, setOptimisationMode] = useState<string>("simple");
  const [accordionValue, setAccordionValue] = useState<string | null>("0");

  const form = useForm<OptimizationInput>({
    initialValues: {
      name: "",
      numberOfSequences: 3,
      sequence: {
        codingSequenceType: "nucleic-acid",
        codingSequence: "",
        fivePrimeUtr: "",
        threePrimeUtr: "",
        polyATail: "",
      },
      parameters: [createDefaultParameter()],
    },
    transformValues: (values) => OptimizationInput.parse(values),
    validate: (values) => {
      const result = OptimizationInput.safeParse(values);
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

  const handleOptimisationModeOnChange = (v: string) => {
    setOptimisationMode(v);
    if (v === "simple") {
      form.setFieldValue("parameters", [createDefaultParameter()]);
    } else {
      form.setFieldValue("parameters", [
        createDefaultParameter(
          1,
          nucleotideCDSLength(form.getValues().sequence) || 90,
        ),
      ]);
      setAccordionValue("0");
    }
  };

  const handleOnAddParameter = () => {
    const { sequence, parameters } = form.getValues();
    const numParameters = parameters.length;
    const startCoordinate = numParameters ? 1 : null;
    const endCoordinate = numParameters
      ? nucleotideCDSLength(sequence) || 90
      : null;
    form.insertListItem(
      "parameters",
      createDefaultParameter(startCoordinate, endCoordinate),
    );
    setAccordionValue(numParameters.toString());
  };

  const handleOnDeleteParameter = (index: number) => {
    form.removeListItem("parameters", index);
  };

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack pos="relative">
        <Fieldset legend="Details">
          <TextInput
            label="Sequence name"
            key={form.key("name")}
            {...form.getInputProps("name")}
          />
          <NumberInput
            label="Number of optimised sequences"
            min={1}
            max={10}
            key={form.key("numberOfSequences")}
            {...form.getInputProps("numberOfSequences")}
          />
        </Fieldset>
        <Fieldset legend="Input sequence">
          <SequenceInput form={form} />
        </Fieldset>
        <Fieldset legend="Sequence optimisation">
          <SegmentedControl
            fullWidth
            data={[
              { label: "Simple (optimise full sequence)", value: "simple" },
              { label: "Advanced (optimise by sub-region)", value: "advanced" },
            ]}
            value={optimisationMode}
            onChange={handleOptimisationModeOnChange}
          />
          <Divider my="sm" />
          {optimisationMode === "simple" && (
            <Box mx="md">
              <ParameterInput index={0} form={form} hideCoordinates />
            </Box>
          )}
          {optimisationMode === "advanced" && (
            <>
              <Accordion
                chevronPosition="left"
                value={accordionValue}
                onChange={setAccordionValue}
              >
                {form.getValues().parameters.map((p, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: No other suitable key
                  <Accordion.Item key={`${index}`} value={index.toString()}>
                    <AccordionControl
                      showDelete={form.getValues().parameters.length > 1}
                      onClickDelete={() => handleOnDeleteParameter(index)}
                    >
                      <Text size="sm">
                        {parameterTitle(form.getValues().sequence, p)}
                      </Text>
                    </AccordionControl>
                    <Accordion.Panel>
                      <ParameterInput index={index} form={form} />
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
              <Center mt="md">
                <Button
                  onClick={handleOnAddParameter}
                  variant="light"
                  color="green"
                  fullWidth
                  leftSection={<PlusIcon size={14} />}
                >
                  Add sub-region for optimisation
                </Button>
              </Center>
            </>
          )}
        </Fieldset>
        <Button
          type="submit"
          disabled={form.getValues().parameters.length === 0}
          color="red"
          variant="light"
        >
          Optimise sequence
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
                      15 +
                    60
                  }
                >
                  {checkSequence(form.getTransformedValues())}
                </ProgressLoader>
              ),
            }}
          />
        )}
      </Stack>
    </form>
  );
};
