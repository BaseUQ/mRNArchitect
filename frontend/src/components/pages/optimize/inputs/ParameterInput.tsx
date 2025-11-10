import {
  Flex,
  Group,
  InputWrapper,
  MultiSelect,
  NativeSelect,
  NumberInput,
  Radio,
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
  form,
  hideCoordinates = false,
  index,
}: {
  form: UseFormReturnType<OptimizationInput>;
  hideCoordinates?: boolean;
  index: number;
}) => {
  const coordinateType =
    Number.isInteger(form.getValues().parameters[index].start_coordinate) ||
    Number.isInteger(form.getValues().parameters[index].end_coordinate)
      ? "sub-region"
      : "full-sequence";

  const handleOnChangeCoordinateType = (value: string) => {
    const {
      sequence: { codingSequence, codingSequenceType },
    } = form.getValues();
    const nucleotideSequenceLength =
      codingSequence.length * (codingSequenceType === "nucleic-acid" ? 1 : 3);
    const end = nucleotideSequenceLength > 3 ? nucleotideSequenceLength : 90;
    form.setFieldValue(
      `parameters.${index}.startCoordinate`,
      value === "sub-region" ? 1 : null,
    );
    form.setFieldValue(
      `parameters.${index}.endCoordinate`,
      value === "sub-region" ? end : null,
    );
  };

  return (
    <Stack>
      {!hideCoordinates && (
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
            {coordinateType === "sub-region" && (
              <Flex
                direction={{ base: "column", sm: "row" }}
                justify="flex-start"
                align="start"
                gap="lg"
              >
                <NumberInput
                  label="Start coordinate"
                  min={1}
                  step={1}
                  key={form.key(`parameters.${index}.start_coordinate`)}
                  {...form.getInputProps(
                    `parameters.${index}.start_coordinate`,
                  )}
                />
                <NumberInput
                  label="End coordinate"
                  min={1}
                  step={1}
                  key={form.key(`parameters.${index}.end_coordinate`)}
                  {...form.getInputProps(`parameters.${index}.end_coordinate`)}
                />
              </Flex>
            )}
            <Switch
              label="Don't optimise region"
              onLabel="ON"
              offLabel="OFF"
              key={form.key(`parameters.${index}.enforce_sequence`)}
              {...form.getInputProps(`parameters.${index}.enforce_sequence`, {
                type: "checkbox",
              })}
            />
          </Stack>
        </InputWrapper>
      )}
      {!form.getValues().parameters[index].enforce_sequence && (
        <>
          {false && (
            <Radio.Group
              name="objective"
              label="Optimization objective"
              value={
                form.getValues().parameters[index].optimize_cai ? "cai" : "tai"
              }
              onChange={(v) => {
                const optimizeCai = v === "cai";
                const optimizeTai = v === "cai" ? null : 1.0;
                form.setFieldValue(
                  `parameters.${index}.optimize_cai`,
                  optimizeCai,
                );
                form.setFieldValue(
                  `parameters.${index}.optimize_tai`,
                  optimizeTai,
                );
              }}
            >
              <Group>
                <Radio value="cai" label="Codon Adaptation Index (CAI)" />
                <Radio value="tai" label="tRNA Adaptation Index (tAI)" />
              </Group>
            </Radio.Group>
          )}
          <NativeSelect
            label="Organism"
            data={ORGANISMS}
            key={form.key(`parameters.${index}.codon_usage_table`)}
            {...form.getInputProps(`parameters.${index}.codon_usage_table`)}
          />
          <NumberInput
            label="Avoid repeat length"
            min={6}
            step={1}
            key={form.key(`parameters.${index}.avoid_repeat_length`)}
            {...form.getInputProps(`parameters.${index}.avoid_repeat_length`)}
          />
          <Flex
            direction={{ base: "column", sm: "row" }}
            justify="flex-start"
            align="start"
            gap="xl"
          >
            <Stack justify="flex-start">
              <Switch
                label="Enable uridine depletion"
                onLabel="ON"
                offLabel="OFF"
                key={form.key(`parameters.${index}.enable_uridine_depletion`)}
                {...form.getInputProps(
                  `parameters.${index}.enable_uridine_depletion`,
                  {
                    type: "checkbox",
                  },
                )}
              />
              <Switch
                label="Avoid ribosome slip"
                onLabel="ON"
                offLabel="OFF"
                key={form.key(`parameters.${index}.avoid_ribosome_slip`)}
                {...form.getInputProps(
                  `parameters.${index}.avoid_ribosome_slip`,
                  {
                    type: "checkbox",
                  },
                )}
              />
            </Stack>
            <Stack justify="flex-start">
              <Switch
                label="Avoid manufacture restriction sites"
                onLabel="ON"
                offLabel="OFF"
                key={form.key(
                  `parameters.${index}.avoid_manufacture_restriction_sites`,
                )}
                {...form.getInputProps(
                  `parameters.${index}.avoid_manufacture_restriction_sites`,
                  { type: "checkbox" },
                )}
              />
              <Switch
                label="Avoid microRNA seed sites"
                onLabel="ON"
                offLabel="OFF"
                key={form.key(`parameters.${index}.avoid_micro_rna_seed_sites`)}
                {...form.getInputProps(
                  `parameters.${index}.avoid_micro_rna_seed_sites`,
                  {
                    type: "checkbox",
                  },
                )}
              />
            </Stack>
          </Flex>
          <InputWrapper label="GC content (Global)">
            <InputWrapper
              label="Minimum/maximum GC content"
              flex="1"
              pl="sm"
              pb="sm"
            >
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
                key={form.key(`parameters.${index}.minMaxGCContentGlobal`)}
                value={[
                  form.getValues().parameters[index].gc_content_global_min,
                  form.getValues().parameters[index].gc_content_global_max,
                ]}
                onChange={([min, max]) => {
                  form.setFieldValue(
                    `parameters.${index}.gc_content_global_min`,
                    min,
                  );
                  form.setFieldValue(
                    `parameters.${index}.gc_content_global_max`,
                    max,
                  );
                }}
              />
            </InputWrapper>
          </InputWrapper>
          <InputWrapper label="GC content (Window)">
            <Flex
              direction="column"
              justify="flex-start"
              align="start"
              gap="lg"
              pl="sm"
            >
              <InputWrapper
                label="Minimum/maximum GC content"
                flex="1"
                w="100%"
              >
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
                  key={form.key(`parameters.${index}.minMaxGCContentWindow`)}
                  value={[
                    form.getValues().parameters[index].gc_content_window_min,
                    form.getValues().parameters[index].gc_content_window_max,
                  ]}
                  onChange={([min, max]) => {
                    form.setFieldValue(
                      `parameters.${index}.gc_content_window_min`,
                      min,
                    );
                    form.setFieldValue(
                      `parameters.${index}.gc_content_window_max`,
                      max,
                    );
                  }}
                />
              </InputWrapper>
              <NumberInput
                label="GC content window size"
                min={1}
                step={1}
                key={form.key(`parameters.${index}.gc_content_window_size`)}
                {...form.getInputProps(
                  `parameters.${index}.gc_content_window_size`,
                )}
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
            key={form.key(`parameters.${index}.avoid_restriction_sites`)}
            {...form.getInputProps(
              `parameters.${index}.avoid_restriction_sites`,
            )}
          />
          <TagsInput
            label="Avoid sequences"
            placeholder="Press Enter to add sequence"
            styles={{ input: { fontFamily: "monospace" } }}
            key={form.key(`parameters.${index}.avoid_sequences`)}
            {...form.getInputProps(`parameters.${index}.avoid_sequences`)}
          />
          <InputWrapper label="Avoid homopolymer tracts">
            <Flex
              direction={{ base: "column", sm: "row" }}
              justify="space-between"
              align="start"
              gap="lg"
              pl="sm"
            >
              <NumberInput
                label="Poly(U)"
                min={0}
                step={1}
                key={form.key(`parameters.${index}.avoid_poly_t`)}
                {...form.getInputProps(`parameters.${index}.avoid_poly_t`)}
              />
              <NumberInput
                label="Poly(A)"
                min={0}
                step={1}
                key={form.key(`parameters.${index}.avoid_poly_a`)}
                {...form.getInputProps(`parameters.${index}.avoid_poly_a`)}
              />
              <NumberInput
                label="Poly(C)"
                min={0}
                step={1}
                key={form.key(`parameters.${index}.avoid_poly_c`)}
                {...form.getInputProps(`parameters.${index}.avoid_poly_c`)}
              />
              <NumberInput
                label="Poly(G)"
                min={0}
                step={1}
                key={form.key(`parameters.${index}.avoid_poly_g`)}
                {...form.getInputProps(`parameters.${index}.avoid_poly_g`)}
              />
            </Flex>
          </InputWrapper>
          <InputWrapper label="Avoid hairpins">
            <Flex
              direction={{ base: "column", sm: "row" }}
              justify="flex-start"
              align="start"
              gap="lg"
              pl="sm"
            >
              <NumberInput
                label="Hairpin stem size"
                min={0}
                step={1}
                key={form.key(`parameters.${index}.hairpin_stem_size`)}
                {...form.getInputProps(`parameters.${index}.hairpin_stem_size`)}
              />
              <NumberInput
                label="Hairpin window"
                min={0}
                step={1}
                key={form.key(`parameters.${index}.hairpin_window`)}
                {...form.getInputProps(`parameters.${index}.hairpin_window`)}
              />
            </Flex>
          </InputWrapper>
        </>
      )}
    </Stack>
  );
};
