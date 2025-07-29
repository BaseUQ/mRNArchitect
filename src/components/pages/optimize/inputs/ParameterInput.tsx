import {
  Flex,
  Group,
  InputWrapper,
  MultiSelect,
  NativeSelect,
  NumberInput,
  RangeSlider,
  SegmentedControl,
  Stack,
  Switch,
  TagsInput,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import type { OptimizationInput } from "~/components/pages/optimize/types";
import { ORGANISMS } from "~/constants";
import RESTRICTION_SITES from "~/data/restriction-sites.json";

export const ParameterInput = ({
  index,
  form,
}: {
  index: number;
  form: UseFormReturnType<OptimizationInput>;
}) => {
  const coordinateType =
    form.getValues().parameters[index].start_coordinate === null
      ? "full-sequence"
      : "sub-region";

  const handleOnChangeCoordinateType = (value: string) => {
    const end = form.getValues().sequence.codingSequence.length || 100;
    form.setFieldValue(
      `parameters.${index}.start_coordinate`,
      value === "sub-region" ? 1 : null,
    );
    form.setFieldValue(
      `parameters.${index}.end_coordinate`,
      value === "sub-region" ? end : null,
    );
  };

  return (
    <Stack>
      <InputWrapper label="Nucleotide coordinates">
        <Stack justify="start">
          <SegmentedControl
            data={[
              { label: "Full sequence", value: "full-sequence" },
              { label: "Sub-region", value: "sub-region" },
            ]}
            value={coordinateType}
            onChange={handleOnChangeCoordinateType}
          />
          <Group>
            <NumberInput
              label="Start coordinate"
              disabled={coordinateType === "full-sequence"}
              min={1}
              step={1}
              key={form.key(`parameters.${index}.start_coordinate`)}
              {...form.getInputProps(`parameters.${index}.start_coordinate`)}
            />
            <NumberInput
              label="End coordinate"
              disabled={coordinateType === "full-sequence"}
              min={1}
              step={1}
              key={form.key(`parameters.${index}.end_coordinate`)}
              {...form.getInputProps(`parameters.${index}.end_coordinate`)}
            />
          </Group>
        </Stack>
      </InputWrapper>
      <NativeSelect
        label="Organism"
        data={ORGANISMS}
        key={form.key(`parameters.${index}.organism`)}
        {...form.getInputProps(`parameters.${index}.organism`)}
      />
      <NumberInput
        label="Avoid repeat length"
        min={6}
        step={1}
        key={form.key(`parameters.${index}.avoidRepeatLength`)}
        {...form.getInputProps(`parameters.${index}.avoidRepeatLength`)}
      />
      <Switch
        label="Enable uridine depletion"
        onLabel="ON"
        offLabel="OFF"
        key={form.key(`parameters.${index}.enableUridineDepletion`)}
        {...form.getInputProps(`parameters.${index}.enableUridineDepletion`, {
          type: "checkbox",
        })}
      />
      <Switch
        label="Avoid ribosome slip"
        onLabel="ON"
        offLabel="OFF"
        key={form.key(`parameters.${index}.avoidRibosomeSlip`)}
        {...form.getInputProps(`parameters.${index}.avoidRibosomeSlip`, {
          type: "checkbox",
        })}
      />
      <InputWrapper label="GC content">
        <Flex
          direction={{ base: "column", sm: "row" }}
          justify="flex-start"
          gap="lg"
          pl="sm"
        >
          <InputWrapper label="Minimum/maximum GC content" flex="1">
            <RangeSlider
              min={0}
              max={1}
              step={0.05}
              minRange={0}
              marks={[
                { value: 0, label: "0" },
                { value: 0.25, label: "0.25" },
                { value: 0.5, label: "0.5" },
                { value: 0.75, label: "0.75" },
                { value: 1, label: "1" },
              ]}
              key={form.key(`parameters.${index}.minMaxGCContent`)}
              value={[
                form.getValues().parameters[index].gcContentMin,
                form.getValues().parameters[index].gcContentMax,
              ]}
              onChange={([min, max]) => {
                form.setFieldValue(`parameters.${index}.gcContentMin`, min);
                form.setFieldValue(`parameters.${index}.gcContentMax`, max);
              }}
            />
          </InputWrapper>
          <NumberInput
            label="GC content window"
            min={1}
            step={1}
            key={form.key(`parameters.${index}.gcContentWindow`)}
            {...form.getInputProps(`parameters.${index}.gcContentWindow`)}
          />
        </Flex>
      </InputWrapper>
      <MultiSelect
        label="Avoid cut sites"
        placeholder="Choose sites..."
        searchable
        data={Object.keys(RESTRICTION_SITES)
          .sort()
          .map((v) => ({
            label: v,
            value: v,
          }))}
        key={form.key(`parameters.${index}.avoidRestrictionSites`)}
        {...form.getInputProps(`parameters.${index}.avoidRestrictionSites`)}
      />
      <TagsInput
        label="Avoid sequences"
        placeholder="Press Enter to add sequence"
        key={form.key(`parameters.${index}.avoidSequences`)}
        {...form.getInputProps(`parameters.${index}.avoidSequences`)}
      />
      <InputWrapper label="Avoid homopolymer tracts">
        <Flex
          direction={{ base: "column", sm: "row" }}
          justify="space-between"
          gap="lg"
          pl="sm"
        >
          <NumberInput
            label="Poly(U)"
            min={0}
            step={1}
            key={form.key(`parameters.${index}.avoidPolyT`)}
            {...form.getInputProps(`parameters.${index}.avoidPolyT`)}
          />
          <NumberInput
            label="Poly(A)"
            min={0}
            step={1}
            key={form.key(`parameters.${index}.avoidPolyA`)}
            {...form.getInputProps(`parameters.${index}.avoidPolyA`)}
          />
          <NumberInput
            label="Poly(C)"
            min={0}
            step={1}
            key={form.key(`parameters.${index}.avoidPolyC`)}
            {...form.getInputProps(`parameters.${index}.avoidPolyC`)}
          />
          <NumberInput
            label="Poly(G)"
            min={0}
            step={1}
            key={form.key(`parameters.${index}.avoidPolyG`)}
            {...form.getInputProps(`parameters.${index}.avoidPolyG`)}
          />
        </Flex>
      </InputWrapper>
      <InputWrapper label="Avoid hairpins">
        <Flex
          direction={{ base: "column", sm: "row" }}
          justify="flex-start"
          gap="lg"
          pl="sm"
        >
          <NumberInput
            label="Hairpin stem size"
            min={0}
            step={1}
            key={form.key(`parameters.${index}.hairpinStemSize`)}
            {...form.getInputProps(`parameters.${index}.hairpinStemSize`)}
          />
          <NumberInput
            label="Hairpin window"
            min={0}
            step={1}
            key={form.key(`parameters.${index}.hairpinWindow`)}
            {...form.getInputProps(`parameters.${index}.hairpinWindow`)}
          />
        </Flex>
      </InputWrapper>
    </Stack>
  );
};
