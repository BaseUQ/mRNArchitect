import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Fieldset,
  Group,
  Modal,
  ModalProps,
  NumberInput,
  Radio,
  Stack,
  Text,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  FIVE_PRIME_HUMAN_ALPHA_GLOBIN,
  THREE_PRIME_HUMAN_ALPHA_GLOBIN,
} from "~/constants";
import { Sequence } from "~/types/sequence";

export interface SequenceModalProps extends ModalProps {
  initialSequence?: Sequence;
  onSave: (sequence: Sequence) => void;
}

const INITIAL_SEQUENCE: Sequence = {
  codingSequenceType: "nucleic-acid",
  codingSequence: "",
  fivePrimeUTR: "",
  threePrimeUTR: "",
  polyATail: "",
};

export const SequenceModal = ({
  initialSequence = INITIAL_SEQUENCE,
  onSave,
  ...props
}: SequenceModalProps) => {
  const [fivePrimeUTRSequenceType, setFivePrimeUTRSequenceType] = useState<
    "human-alpha-globin" | "custom"
  >("custom");
  const [threePrimeUTRSequenceType, setThreePrimeUTRSequenceType] = useState<
    "human-alpha-globin" | "custom"
  >("custom");
  const [polyATailType, setPolyATailType] = useState<
    "none" | "generate" | "custom"
  >("none");
  const [polyATailGenerate, setPolyATailGenerate] = useState<string | number>(
    120,
  );

  const form = useForm<Sequence>({
    initialValues: initialSequence,
    validate: (values) => {
      const result = Sequence.safeParse(values);
      console.log(result);
      if (result.error) {
        return Object.fromEntries(
          result.error.issues
            .filter((issue) => issue.path.length)
            .map((issue) => [issue.path[0], issue.message]),
        );
      }
      return {};
    },
  });

  useEffect(() => {
    if (fivePrimeUTRSequenceType === "human-alpha-globin") {
      form.setFieldValue("fivePrimeUTR", FIVE_PRIME_HUMAN_ALPHA_GLOBIN);
    }
  }, [fivePrimeUTRSequenceType]);

  useEffect(() => {
    if (threePrimeUTRSequenceType === "human-alpha-globin") {
      form.setFieldValue("threePrimeUTR", THREE_PRIME_HUMAN_ALPHA_GLOBIN);
    }
  }, [threePrimeUTRSequenceType]);

  useEffect(() => {
    if (polyATailType === "none") {
      form.setFieldValue("polyATail", "");
    } else if (polyATailType === "generate") {
      const length =
        typeof polyATailGenerate === "string"
          ? parseInt(polyATailGenerate)
          : polyATailGenerate;
      form.setFieldValue("polyATail", "A".repeat(length));
    }
  }, [polyATailType, polyATailGenerate]);

  const handleOnSave = () => {
    const result = form.validate();
    if (!result.hasErrors) {
      onSave(form.getValues());
    }
  };

  return (
    <Modal {...props}>
      <Stack>
        <Fieldset>
          <Stack>
            <div>
              <Radio.Group
                label="Coding sequence"
                description={
                  "Add your coding sequence of interest here. You can paste either the amino acid, RNA or DNA sequence. You may also want to consider adding useful sequence elements such as nuclear localization signals, signal peptides, or other tags. Ensure your coding sequence starts with a MET codon and ends with a STOP codon. You may want to use two different stop codons for efficient termination (e.g., UAG/UGA)."
                }
                withAsterisk
                key={form.key("codingSequenceType")}
                {...form.getInputProps("codingSequenceType")}
              >
                <Group style={{ padding: "5px" }}>
                  <Radio value="nucleic-acid" label="Nucleic acid" />
                  <Radio value="amino-acid" label="Amino acid" />
                </Group>
              </Radio.Group>
              <Textarea
                spellCheck={false}
                label="Coding sequence textarea"
                labelProps={{ display: "none" }}
                placeholder="Paste your sequence here..."
                autosize
                minRows={5}
                resize="vertical"
                withAsterisk
                key={form.key("codingSequence")}
                {...form.getInputProps("codingSequence")}
              />
            </div>
            <div>
              <Radio.Group
                label="5' UTR"
                description={
                  "Paste your 5' untranslated sequence here. The 5' untranslated region (UTR) is bound and scanned by the ribosome and is needed for translation. We provide a well-validated option, the human alpha-globin (HBA1; Gene ID 3039) 5' UTR sequence that has been validated in different cell types and applications. By default, no 5' UTR will be added."
                }
                value={fivePrimeUTRSequenceType}
                onChange={(v) =>
                  setFivePrimeUTRSequenceType(
                    v as typeof fivePrimeUTRSequenceType,
                  )
                }
              >
                <Group style={{ padding: "5px" }}>
                  <Radio
                    value="human-alpha-globin"
                    label="Human alpha-globin"
                  />
                  <Radio value="custom" label="Custom" />
                </Group>
              </Radio.Group>
              <Textarea
                spellCheck={false}
                disabled={fivePrimeUTRSequenceType === "human-alpha-globin"}
                placeholder="Paste your sequence here..."
                autosize
                minRows={2}
                resize="vertical"
                key={form.key("fivePrimeUTR")}
                {...form.getInputProps("fivePrimeUTR")}
              />
            </div>
            <div>
              <Radio.Group
                label="3' UTR"
                description={
                  "Paste your 3' untranslated sequence here. The 3' untranslated region (UTR) is regulated by microRNAs and RNA-binding proteins and plays a key role in cell-specific mRNA stability and expression. We provide a well-validated option, the human alpha-globin (HBA1; Gene ID 3039) 3' UTR sequence that has been validated in different cell types and applications. By default, no 3' UTR will be added."
                }
                value={threePrimeUTRSequenceType}
                onChange={(v) =>
                  setThreePrimeUTRSequenceType(
                    v as typeof threePrimeUTRSequenceType,
                  )
                }
              >
                <Group style={{ padding: "5px" }}>
                  <Radio
                    value="human-alpha-globin"
                    label="Human alpha-globin"
                  />
                  <Radio value="custom" label="Custom" />
                </Group>
              </Radio.Group>
              <Textarea
                spellCheck={false}
                disabled={threePrimeUTRSequenceType === "human-alpha-globin"}
                placeholder="Paste your sequence here..."
                autosize
                minRows={2}
                resize="vertical"
                key={form.key("threePrimeUTR")}
                {...form.getInputProps("threePrimeUTR")}
              />
            </div>

            <div>
              <Radio.Group
                label="Poly(A) tail"
                description={
                  "Specify the length of the poly(A) tail or alternatively paste more complex designs. The length of the poly(A) tail plays a critical role in mRNA translation and stability. By default, no poly(A) tail will be added."
                }
                value={polyATailType}
                onChange={(v) => setPolyATailType(v as typeof polyATailType)}
              >
                <Group style={{ padding: "5px" }}>
                  <Radio value="none" label="None" />
                  <Radio value="generate" label="Generate" />
                  <Radio value="custom" label="Custom" />
                </Group>
              </Radio.Group>
              {polyATailType === "generate" && (
                <NumberInput
                  min={1}
                  stepHoldDelay={500}
                  stepHoldInterval={100}
                  value={polyATailGenerate}
                  onChange={setPolyATailGenerate}
                />
              )}
              {polyATailType === "custom" && (
                <Textarea
                  spellCheck={false}
                  placeholder="Paste your sequence here..."
                  autosize
                  minRows={2}
                  resize="vertical"
                  key={form.key("polyATail")}
                  {...form.getInputProps("polyATail")}
                />
              )}
            </div>
          </Stack>
        </Fieldset>
        <Group grow>
          <Button onClick={props.onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleOnSave}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export interface SequenceRowProps {
  editable?: boolean;
  sequence?: Sequence;
  onDelete?: (sequence: Sequence) => void;
  onSave?: (sequence: Sequence) => void;
}

export const SequenceRow = ({
  editable = true,
  sequence,
  onDelete,
  onSave,
}: SequenceRowProps) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const handleOnSave = (sequence: Sequence) => {
    setIsEditing(false);
    if (onSave) {
      onSave(sequence);
    }
  };

  return (
    <>
      <SequenceModal
        opened={isEditing}
        initialSequence={sequence}
        onSave={handleOnSave}
        onClose={() => setIsEditing(false)}
      />
      <Card shadow="md">
        {sequence && sequence.codingSequence && (
          <Stack>
            {editable && (
              <Group justify="end">
                <Button.Group>
                  <Button onClick={() => setIsEditing(true)}>Edit</Button>
                  <Button
                    onClick={() => (onDelete ? onDelete(sequence) : null)}
                    variant="outline"
                    color="red"
                  >
                    Delete
                  </Button>
                </Button.Group>
              </Group>
            )}
            <Text ff="monospace" p="md" style={{ wordBreak: "break-all" }}>
              {sequence.fivePrimeUTR && (
                <Tooltip label="5' UTR">
                  <Text component="span" c="green">
                    {sequence.fivePrimeUTR}
                  </Text>
                </Tooltip>
              )}
              <Tooltip label="Coding sequence">
                <Text component="span">{sequence.codingSequence}</Text>
              </Tooltip>
              {sequence.threePrimeUTR && (
                <Tooltip label="3' UTR">
                  <Text component="span" c="green">
                    {sequence.threePrimeUTR}
                  </Text>
                </Tooltip>
              )}
              {sequence.polyATail && (
                <Tooltip label="Poly(A) tail">
                  <Text component="span" c="blue">
                    {sequence.polyATail}
                  </Text>
                </Tooltip>
              )}
            </Text>
          </Stack>
        )}
      </Card>
    </>
  );
};
