import {
  Fieldset,
  Flex,
  InputWrapper,
  MultiSelect,
  NativeSelect,
  NumberInput,
  RangeSlider,
  Stack,
  Switch,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { ORGANISMS } from "~/components/constants";
import RESTRICTION_SITES from "~/data/restriction-sites.json";
import {
  OptimizationConstraint,
  OptimizationObjective,
} from "~/types/optimize";
import {
  OptimizationObjective,
  type OptimizationObjectiveProps,
} from "~/components/forms/OptimizationObjective";

interface RegionProps {
  start: number;
  end: number;
  sequenceLength: number;
}

const Region = ({ start, end, sequenceLength }: RegionProps) => {
  return <NumberInput min={1} max={sequenceLength - 1} />;
};

export interface OptimizationParametersProps {
  constraints: OptimizationConstraint[];
  objectives: OptimizationObjective[];
}

export const OptimizationParameters = ({
  constraints,
  objectives,
}: OptimizationParametersProps) => {
  const [objective, setObjective] = useState<
    OptimizationObjectiveProps["objective"]
  >({
    start: null,
    end: null,
    organism: ORGANISMS[0].value,
    avoidRepeatLength: 10,
  });
  const showHelp = false;
  const form = useForm<OptimizationConstraint>({
    mode: "uncontrolled",
    initialValues: {
      start: null,
      end: null,
      //organism: ORGANISMS[0].value,
      enableUridineDepletion: false,
      avoidRibosomeSlip: false,
      gcContentMin: 0.4,
      gcContentMax: 0.7,
      gcContentWindow: 100,
      avoidRestrictionSites: [],
      avoidSequences: "",
      avoidRepeatLength: 10,
      avoidPolyT: 9,
      avoidPolyA: 9,
      avoidPolyC: 6,
      avoidPolyG: 6,
      hairpinStemSize: 10,
      hairpinWindow: 60,
    },
    validate: (values) => {
      const result = OptimizationConstraint.safeParse(values);
      if (!result.error) {
        return {};
      }
      return Object.fromEntries(
        result.error.issues
          .filter((issue) => issue.path.length)
          .map((issue) => [issue.path[0], issue.message]),
      );
    },
  });

  return (
    <>
      <OptimizationObjective objective={objective} onChange={setObjective} />
      <Fieldset legend="Parameters">
        <Stack>
          <Switch
            label="Uridine depletion"
            description={
              showHelp &&
              "If selected, this minimizes the use of uridine nucleosides in the mRNA sequence. This is achieved by avoiding codons that encode uridine at the third wobble position and can impact the reactogenicity of the mRNA sequence."
            }
            key={form.key("avoidUridineDepletion")}
            {...form.getInputProps("avoidUridineDepletion")}
          />
          <Switch
            label="Avoid ribosome slip"
            description={
              showHelp &&
              "Avoid more than 3 consecutive Us in the open-reading frame, where ribosomes can +1 frameshift at consecutive N1-methylpseudouridines (2)."
            }
            key={form.key("avoidRibosomeSlip")}
            {...form.getInputProps("avoidRibosomeSlip")}
          />
          <InputWrapper
            label="Minimum/maximum GC content"
            description={
              showHelp &&
              "Defines the minimum or maximum fraction of the mRNA sequence comprising G/C nucleotides that is associated with stability and hairpins of the mRNA. We recommend 0.4 to 0.7."
            }
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
              key={form.key("minMaxGCContent")}
              value={[
                form.getValues().gcContentMin,
                form.getValues().gcContentMax,
              ]}
              onChange={([min, max]) => {
                form.setFieldValue("gcContentMin", min);
                form.setFieldValue("gcContentMax", max);
              }}
            />
          </InputWrapper>
          <NumberInput
            label="GC content window"
            description={
              showHelp &&
              "The window size across which the min/max GC content is calculated and imposed. We recommend 100."
            }
            min={1}
            step={1}
            key={form.key("gcContentWindow")}
            {...form.getInputProps("gcContentWindow")}
          />
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
            key={form.key("avoidRestrictionSites")}
            {...form.getInputProps("avoidRestrictionSites")}
          />
          <TextInput
            label="Avoid sequences"
            description={
              showHelp &&
              "Specify sequences that should be avoided in the mRNA sequence."
            }
            placeholder="e.g. ATGATG"
            key={form.key("avoidSequences")}
            {...form.getInputProps("avoidSequences")}
          />
          <NumberInput
            label="Avoid repeat length"
            description={
              showHelp &&
              "Avoid repeating any sequences longer than this length within the mRNA. We recommend 10 nucleotides."
            }
            min={6}
            step={1}
            key={form.key("avoidRepeatLength")}
            {...form.getInputProps("avoidRepeatLength")}
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
              gap="sm"
              pl="sm"
            >
              <NumberInput
                label="Poly(U)"
                min={0}
                step={1}
                key={form.key("avoidPolyT")}
                {...form.getInputProps("avoidPolyT")}
              />
              <NumberInput
                label="Poly(A)"
                min={0}
                step={1}
                key={form.key("avoidPolyA")}
                {...form.getInputProps("avoidPolyA")}
              />
              <NumberInput
                label="Poly(C)"
                min={0}
                step={1}
                key={form.key("avoidPolyC")}
                {...form.getInputProps("avoidPolyC")}
              />
              <NumberInput
                label="Poly(G)"
                min={0}
                step={1}
                key={form.key("avoidPolyG")}
                {...form.getInputProps("avoidPolyG")}
              />
            </Flex>
          </InputWrapper>
          <NumberInput
            label="Hairpin stem size"
            description={
              showHelp &&
              "Avoid stable hairpins longer than this length. We recommend 10."
            }
            min={0}
            step={1}
            key={form.key("hairpinStemSize")}
            {...form.getInputProps("hairpinStemSize")}
          />
          <NumberInput
            label="Hairpin window"
            description={
              showHelp &&
              "Window size used to measure hairpins. We recommend 60."
            }
            min={0}
            step={1}
            key={form.key("hairpinWindow")}
            {...form.getInputProps("hairpinWindow")}
          />
        </Stack>
      </Fieldset>
    </>
  );
};
