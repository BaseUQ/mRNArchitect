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
import { UseFormReturnType } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import RESTRICTION_SITES from "~/data/restriction-sites.json";
import { OptimizationForm } from "~/components/pages/optimizer/types";

export const ConstraintInput = ({
  index,
  form,
}: {
  index: number;
  form: UseFormReturnType<OptimizationForm>;
}) => {
  const [showHelp, showHelpHandlers] = useDisclosure(false);
  const [coordinateType, setCoordinateType] = useState<string>("full-sequence");

  const prefix = `constraints.${index}`;

  return (
    <Stack>
      <InputWrapper
        label="Nucleotide coordintates"
        description={
          showHelp &&
          'The coordinates within the coding region to which the constraints will be applied. Note that the coordinates start at 1, and is inclusive of the end coordinate. Selecting "Full sequence" will apply constraints to the whole seqeunce.'
        }
      >
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
        description={
          showHelp &&
          "If selected, this minimizes the use of uridine nucleosides in the mRNA sequence. This is achieved by avoiding codons that encode uridine at the third wobble position and can impact the reactogenicity of the mRNA sequence."
        }
        onLabel="ON"
        offLabel="OFF"
        key={form.key(`constraints.${index}.enableUridineDepletion`)}
        {...form.getInputProps(`constraints.${index}.enableUridineDepletion`, {
          type: "checkbox",
        })}
      />
      <Switch
        label="Avoid ribosome slip"
        description={
          showHelp &&
          "Avoid more than 3 consecutive Us in the open-reading frame, where ribosomes can +1 frameshift at consecutive N1-methylpseudouridines (2)."
        }
        onLabel="ON"
        offLabel="OFF"
        key={form.key(`constraints.${index}.avoidRibosomeSlip`)}
        {...form.getInputProps(`constraints.${index}.avoidRibosomeSlip`, {
          type: "checkbox",
        })}
      />
      <InputWrapper
        label="GC content"
        description={
          showHelp &&
          "Defines the minimum or maximum fraction of the mRNA sequence comprising G/C nucleotides that is associated with stability and hairpins of the mRNA. This is enforced for both the full sequence and on a sliding window. We recommend a range of 0.4 to 0.7, and a window size of 100."
        }
      >
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
        description={
          showHelp &&
          "Specify restriction enzyme sites that should be avoided in the mRNA sequence."
        }
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
        description={
          showHelp &&
          "Specify sequences that should be avoided in the mRNA sequence."
        }
        placeholder="Press Enter to add sequence"
        key={form.key(`constraints.${index}.avoidSequences`)}
        {...form.getInputProps(`constraints.${index}.avoidSequences`)}
      />
      <InputWrapper
        label="Avoid homopolymer tracts"
        description={
          showHelp &&
          "Avoid homopolymer tracts that can be difficult to synthesise and translate. We recommend 9 for poly(U)/poly(A) and 6 for poly(C)/poly(G)."
        }
      >
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
      <InputWrapper
        label="Avoid hairpins"
        description={
          showHelp &&
          "Avoid stable hairpins longer than the given length within the given window size. We recommend a length of 10 and window size of 60."
        }
      >
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
