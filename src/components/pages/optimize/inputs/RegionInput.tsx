import {
  Flex,
  Group,
  InputWrapper,
  MultiSelect,
  NumberInput,
  RangeSlider,
  SegmentedControl,
  Stack,
  Switch,
  TagsInput,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { useState } from "react";
import type { OptimizationInput } from "~/components/pages/optimize/types";
import RESTRICTION_SITES from "~/data/restriction-sites.json";

export const RegionInput = ({
  index,
  form,
}: {
  index: number;
  form: UseFormReturnType<OptimizationInput>;
}) => {
  const [coordinateType, setCoordinateType] = useState<string>("full-sequence");

  return (
    <Stack>
      <InputWrapper label="Nucleotide coordintates">
        <Stack justify="start">
          <SegmentedControl
            data={[
              { label: "Full sequence", value: "full-sequence" },
              { label: "Sub-sequence", value: "sub-sequence" },
            ]}
            value={coordinateType}
            onChange={setCoordinateType}
          />
          <Group>
            <NumberInput
              label="Start coordinate"
              disabled={coordinateType === "full-sequence"}
              min={1}
              key={form.key(`constraints.${index}.start`)}
              {...form.getInputProps(`constraints.${index}.start`)}
            />
            <NumberInput
              label="End coordinate"
              disabled={coordinateType === "full-sequence"}
              min={1}
              key={form.key(`constraints.${index}.end`)}
              {...form.getInputProps(`constraints.${index}.end`)}
            />
          </Group>
        </Stack>
      </InputWrapper>
      <Switch
        label="Enable uridine depletion"
        onLabel="ON"
        offLabel="OFF"
        key={form.key(`constraints.${index}.enableUridineDepletion`)}
        {...form.getInputProps(`constraints.${index}.enableUridineDepletion`, {
          type: "checkbox",
        })}
      />
      <Switch
        label="Avoid ribosome slip"
        onLabel="ON"
        offLabel="OFF"
        key={form.key(`constraints.${index}.avoidRibosomeSlip`)}
        {...form.getInputProps(`constraints.${index}.avoidRibosomeSlip`, {
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
              key={form.key(`constraints.${index}.minMaxGCContent`)}
              value={[
                form.getValues().constraints[index].gcContentMin,
                form.getValues().constraints[index].gcContentMax,
              ]}
              onChange={([min, max]) => {
                form.setFieldValue(`constraints.${index}.gcContentMin`, min);
                form.setFieldValue(`constraints.${index}.gcContentMax`, max);
              }}
            />
          </InputWrapper>
          <NumberInput
            label="GC content window"
            min={1}
            step={1}
            key={form.key(`constraints.${index}.gcContentWindow`)}
            {...form.getInputProps(`constraints.${index}.gcContentWindow`)}
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
        key={form.key(`constraints.${index}.avoidRestrictionSites`)}
        {...form.getInputProps(`constraints.${index}.avoidRestrictionSites`)}
      />
      <TagsInput
        label="Avoid sequences"
        placeholder="Press Enter to add sequence"
        key={form.key(`constraints.${index}.avoidSequences`)}
        {...form.getInputProps(`constraints.${index}.avoidSequences`)}
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
            key={form.key(`constraints.${index}.avoidPolyT`)}
            {...form.getInputProps(`constraints.${index}.avoidPolyT`)}
          />
          <NumberInput
            label="Poly(A)"
            min={0}
            step={1}
            key={form.key(`constraints.${index}.avoidPolyA`)}
            {...form.getInputProps(`constraints.${index}.avoidPolyA`)}
          />
          <NumberInput
            label="Poly(C)"
            min={0}
            step={1}
            key={form.key(`constraints.${index}.avoidPolyC`)}
            {...form.getInputProps(`constraints.${index}.avoidPolyC`)}
          />
          <NumberInput
            label="Poly(G)"
            min={0}
            step={1}
            key={form.key(`constraints.${index}.avoidPolyG`)}
            {...form.getInputProps(`constraints.${index}.avoidPolyG`)}
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
            key={form.key(`constraints.${index}.hairpinStemSize`)}
            {...form.getInputProps(`constraints.${index}.hairpinStemSize`)}
          />
          <NumberInput
            label="Hairpin window"
            min={0}
            step={1}
            key={form.key(`constraints.${index}.hairpinWindow`)}
            {...form.getInputProps(`constraints.${index}.hairpinWindow`)}
          />
        </Flex>
      </InputWrapper>
    </Stack>
  );
};
