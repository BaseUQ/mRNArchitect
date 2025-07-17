import { useRef, useState } from "react";
import {
  Button,
  Card,
  Code,
  Fieldset,
  Flex,
  Group,
  InputWrapper,
  Modal,
  ModalProps,
  MultiSelect,
  NumberInput,
  RangeSlider,
  SegmentedControl,
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

interface ConstraintModalProps extends ModalProps {
  constraint?: Constraint;
  onCancel: (c: Constraint) => void;
  onSave: (c: Constraint) => void;
}

export const ConstraintModal = ({
  constraint = INITIAL_CONSTRAINT,
  onCancel,
  onSave,
  ...props
}: ConstraintModalProps) => {
  const [coordinateType, setCoordinateType] = useState<string>("full-sequence");
  const showHelp = false;

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

  const handleOnSave = () => {
    const result = form.validate();
    if (!result.hasErrors) {
      onSave(form.getValues());
    }
  };

  return (
    <Modal size="auto" title="Configure constraint" {...props}>
      <Stack>
        <Fieldset legend="Coordinates">
          <InputWrapper
            //label="Coordinates"
            description={
              showHelp &&
              "The coordinates within the coding region to which the constraint will be applied. Note that the coordinates start at 1, and is inclusive of the end coordinate."
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
                  label="Start"
                  disabled={coordinateType === "full-sequence"}
                  min={1}
                  key={form.key("start")}
                  {...form.getInputProps("start")}
                />
                <NumberInput
                  label="End"
                  disabled={coordinateType === "full-sequence"}
                  min={1}
                  key={form.key("end")}
                  {...form.getInputProps("end")}
                />
              </Group>
            </Stack>
          </InputWrapper>
        </Fieldset>
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
          <Button variant="outline" onClick={() => onCancel(form.getValues())}>
            Cancel
          </Button>
          <Button onClick={handleOnSave}>Save constraint</Button>
        </Group>
      </Stack>
    </Modal>
  );
};

interface ConstraintRowProps {
  constraint: Constraint;
  editable?: boolean;
  onDelete: (c: Constraint) => void;
  onSave: (c: Constraint) => void;
}

export const ConstraintRow = ({
  editable = false,
  constraint,
  onDelete,
  onSave,
}: ConstraintRowProps) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  console.log(constraint);

  const handleOnSave = (c: Constraint) => {
    setIsEditing(false);
    onSave(c);
  };

  return (
    <>
      <ConstraintModal
        opened={isEditing}
        size="lg"
        onSave={handleOnSave}
        onClose={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
      />
      <Card shadow="sm" radius="md">
        <Group gap="sm" align="start">
          <Code flex="1">{JSON.stringify(constraint, undefined, 2)}</Code>
          {editable && (
            <Button.Group>
              <Button onClick={() => setIsEditing(true)}>Edit</Button>
              <Button
                onClick={() => onDelete(constraint)}
                variant="outline"
                color="red"
              >
                Delete
              </Button>
            </Button.Group>
          )}
        </Group>
      </Card>
    </>
  );
};
