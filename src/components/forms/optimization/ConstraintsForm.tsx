import { useRef, useState } from "react";
import {
  Button,
  Card,
  Fieldset,
  Flex,
  Group,
  InputWrapper,
  Modal,
  MultiSelect,
  NumberInput,
  RangeSlider,
  Stack,
  Switch,
  TagsInput,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import z from "zod/v4";
import { Constraint } from "~/types/optimize";
import RESTRICTION_SITES from "~/data/restriction-sites.json";

const INITIAL_CONSTRAINT: Constraint = {
  start: null,
  end: null,
  enableUridineDepletion: false,
  avoidRibosomeSlip: false,
  gcContentMin: 0.4,
  gcContentMax: 0.7,
  gcContentWindow: 100,
  avoidRestrictionSites: [],
  avoidSequences: [],
  avoidPolyT: 9,
  avoidPolyA: 6,
  avoidPolyC: 6,
  avoidPolyG: 9,
  hairpinStemSize: 10,
  hairpinWindow: 60,
};

interface ConstraintRowProps {
  constraint: Constraint;
  editable?: boolean;
  onSubmit: (c: Constraint) => void;
}

const ConstraintRow = ({
  editable = false,
  constraint,
  onSubmit,
}: ConstraintRowProps) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  console.log(constraint);
  const form = useForm<Constraint>({
    initialValues: constraint,
    validate: (values) => {
      const result = Constraint.safeParse(values);
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

  const handleOnSubmit = () => {
    const result = form.validate();
    if (!result.hasErrors) {
      setIsEditing(false);
      onSubmit(form.getValues());
    }
  };

  const showHelp = true;

  return (
    <>
      <Modal opened={isEditing} onClose={() => {}} withCloseButton={false}>
        <Stack>
          <Switch
            label="Uridine depletion"
            description={
              showHelp &&
              "If selected, this minimizes the use of uridine nucleosides in the mRNA sequence. This is achieved by avoiding codons that encode uridine at the third wobble position and can impact the reactogenicity of the mRNA sequence."
            }
            key={form.key("enableUridineDepletion")}
            {...form.getInputProps("enableUridineDepletion", {
              type: "checkbox",
            })}
          />
          <Switch
            label="Avoid ribosome slip"
            description={
              showHelp &&
              "Avoid more than 3 consecutive Us in the open-reading frame, where ribosomes can +1 frameshift at consecutive N1-methylpseudouridines (2)."
            }
            key={form.key("avoidRibosomeSlip")}
            {...form.getInputProps("avoidRibosomeSlip", { type: "checkbox" })}
          />
          <InputWrapper
            label="GC content"
            description="Defines the minimum or maximum fraction of the mRNA sequence comprising G/C nucleotides that is associated with stability and hairpins of the mRNA. This is enforced for both the full sequence and on a sliding window. We recommend a range of 0.4 to 0.7, and a window size of 100."
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
                min={1}
                step={1}
                key={form.key("gcContentWindow")}
                {...form.getInputProps("gcContentWindow")}
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
            key={form.key("avoidRestrictionSites")}
            {...form.getInputProps("avoidRestrictionSites")}
          />
          <TagsInput
            label="Avoid sequences"
            description={
              showHelp &&
              "Specify sequences that should be avoided in the mRNA sequence."
            }
            placeholder="Press Enter to add sequence"
            key={form.key("avoidSequences")}
            {...form.getInputProps("avoidSequences")}
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
          <InputWrapper
            label="Avoid hairpins"
            description="Avoid stable hairpins longer than the given length within the given window size. We recommend a length of 10 and window size of 60."
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
                key={form.key("hairpinStemSize")}
                {...form.getInputProps("hairpinStemSize")}
              />
              <NumberInput
                label="Hairpin window"
                min={0}
                step={1}
                key={form.key("hairpinWindow")}
                {...form.getInputProps("hairpinWindow")}
              />
            </Flex>
          </InputWrapper>
          <Group grow>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleOnSubmit}>Save constraint</Button>
          </Group>
        </Stack>
      </Modal>
      <Card>
        <Text>
          Range: {constraint.start} to {constraint.end}
        </Text>
        <Text>
          Enable uridine depletion:{" "}
          {constraint.enableUridineDepletion ? "yes" : "no"}
        </Text>
        {editable && <Button onClick={() => setIsEditing(true)}>Edit</Button>}
      </Card>
    </>
  );
};

export interface ConstraintsFormProps {
  initialConstraints?: Constraint[];
  onSubmit: (constraints: Constraint[]) => void;
}

export const ConstraintsForm = ({
  initialConstraints = [INITIAL_CONSTRAINT],
  onSubmit,
}: ConstraintsFormProps) => {
  const [constraints, setConstraints] =
    useState<Constraint[]>(initialConstraints);

  const handleOnSubmitConstraint = (index: number, constraint: Constraint) => {
    const newConstraints = [...constraints];
    newConstraints[index] = constraint;
    setConstraints(newConstraints);
  };

  const handleOnSubmit = () => {
    onSubmit(constraints);
  };

  return (
    <>
      {constraints.map((constraint, index) => (
        <ConstraintRow
          editable
          constraint={constraint}
          onSubmit={(c) => handleOnSubmitConstraint(index, c)}
        />
      ))}
      <Button
        onClick={() => setConstraints([...constraints, INITIAL_CONSTRAINT])}
      >
        Add constraint
      </Button>
      <Button onClick={handleOnSubmit}>Next</Button>
    </>
  );
};
