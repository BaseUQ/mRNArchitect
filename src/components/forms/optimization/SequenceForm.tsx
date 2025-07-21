import {
  Alert,
  Button,
  Fieldset,
  Group,
  InputWrapper,
  Modal,
  type ModalProps,
  NumberInput,
  SegmentedControl,
  Space,
  Stack,
  Switch,
  Text,
  Textarea,
  Title,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { QuestionIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import {
  EGFP,
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
  const [showHelp, { toggle: toggleShowHelp }] = useDisclosure(false);
  const [fivePrimeUTRSequenceType, setFivePrimeUTRSequenceType] = useState<
    "human-alpha-globin" | "custom"
  >("custom");
  const [threePrimeUTRSequenceType, setThreePrimeUTRSequenceType] = useState<
    "human-alpha-globin" | "custom"
  >("custom");
  const [polyATailType, setPolyATailType] = useState<
    "none" | "generate" | "custom"
  >(initialSequence.polyATail ? "custom" : "none");
  const [polyATailGenerate, setPolyATailGenerate] = useState<string | number>(
    120,
  );

  const form = useForm<Sequence>({
    initialValues: initialSequence,
    transformValues: (values) => ({
      ...values,
      // Remove any "> ..." metadata lines and all whitespace in text input fields
      codingSequence: values.codingSequence.replaceAll(/(^>.*$)|(\s)/gm, ""),
      fivePrimeUTR: values.fivePrimeUTR.replaceAll(/(^>.*$)|(\s)/g, ""),
      threePrimeUTR: values.threePrimeUTR.replaceAll(/(^>.*$)|(\s)/gm, ""),
      polyATail: values.polyATail.replaceAll(/(^>.*$)|(\s)/gm, ""),
    }),
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
          ? Number.parseInt(polyATailGenerate)
          : polyATailGenerate;
      form.setFieldValue("polyATail", "A".repeat(length));
    }
  }, [polyATailType, polyATailGenerate]);

  const handleOnSave = () => {
    const result = form.validate();
    if (!result.hasErrors) {
      onSave(form.getTransformedValues());
    }
  };

  return (
    <Modal size="xl" title="Configure input sequence" {...props}>
      <Stack>
        {
          <Group w="100%" justify="end">
            <Switch
              label="Show help"
              checked={showHelp}
              onChange={toggleShowHelp}
            />
          </Group>
        }
        <Stack>
          {showHelp && (
            <Alert title="Help" variant="light" icon={<QuestionIcon />}>
              <Text size="sm">
                For guidance on how to design an mRNA, please see the
                step-by-step example{" "}
                <a href="https://basefacility.org.au/wp-content/uploads/2024/12/mRNArchitect_Example.pdf">
                  here
                </a>
                .
              </Text>
              <Space h="xs" />
              <Text size="sm">
                To get started, you can use the button below to prefill the
                Coding sequence input with the{" "}
                <a href="https://pubmed.ncbi.nlm.nih.gov/10857375/">
                  enhanced green fluorescent protein
                </a>
                . Then click the 'Optimize sequence' button to start
                optimization.
              </Text>
              <Space h="xs" />
              <Button
                onClick={() => {
                  form.reset();
                  form.setFieldValue("codingSequenceType", "amino-acid");
                  form.setFieldValue("codingSequence", EGFP);
                }}
              >
                Pre-fill eGFP
              </Button>
              <Title order={6} pt="sm">
                References
              </Title>
              <ol>
                <li>
                  Zulkower, V., & Rosser, S. (2020). DNA Chisel, a versatile
                  sequence optimizer. Bioinformatics, 36(16), 4508-4509.
                </li>
                <li>
                  Mulroney, T.E., Pöyry, T., Yam-Puc, J.C. et al. (2024).
                  N1-methylpseudouridylation of mRNA causes +1 ribosomal
                  frameshifting. Nature 625, 189–194.
                </li>
                <li>
                  Sharp, P. M., & Li, W. H. (1987). The Codon Adaptation Index—a
                  measure of directional synonymous codon usage bias, and its
                  potential applications. Nucleic Acids Research 15(3),
                  1281-1295.
                </li>
                <li>
                  Lorenz, R., Bernhart, S. H., Höner Zu Siederdissen, C., Tafer,
                  H., Flamm, C., Stadler, P. F., & Hofacker, I. L. (2011).
                  ViennaRNA Package 2.0. Algorithms for Molecular Biology, 6:26.
                </li>
              </ol>
            </Alert>
          )}
          <Fieldset legend="Coding sequence">
            <InputWrapper
              description={
                showHelp &&
                "Add your coding sequence of interest here. You can paste either the amino acid, RNA or DNA sequence. You may also want to consider adding useful sequence elements such as nuclear localization signals, signal peptides, or other tags. Ensure your coding sequence starts with a MET codon and ends with a STOP codon. You may want to use two different stop codons for efficient termination (e.g., UAG/UGA)."
              }
            >
              <Stack>
                <SegmentedControl
                  data={[
                    { label: "Nucleic acid", value: "nucleic-acid" },
                    { label: "Amino acid", value: "amino-acid" },
                  ]}
                  key={form.key("codingSequenceType")}
                  {...form.getInputProps("codingSequenceType")}
                />
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
              </Stack>
            </InputWrapper>
          </Fieldset>
          <Fieldset legend="5' UTR">
            <InputWrapper
              description={
                showHelp &&
                "Paste your 5' untranslated sequence here. The 5' untranslated region (UTR) is bound and scanned by the ribosome and is needed for translation. We provide a well-validated option, the human alpha-globin (HBA1; Gene ID 3039) 5' UTR sequence that has been validated in different cell types and applications. By default, no 5' UTR will be added."
              }
            >
              <Stack>
                <SegmentedControl
                  data={[
                    {
                      label: "Human alpha-globin",
                      value: "human-alpha-globin",
                    },
                    { label: "Custom", value: "custom" },
                  ]}
                  value={fivePrimeUTRSequenceType}
                  onChange={(v) =>
                    setFivePrimeUTRSequenceType(
                      v as typeof fivePrimeUTRSequenceType,
                    )
                  }
                />
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
              </Stack>
            </InputWrapper>
          </Fieldset>
          <Fieldset legend="3' UTR">
            <InputWrapper
              description={
                showHelp &&
                "Paste your 3' untranslated sequence here. The 3' untranslated region (UTR) is regulated by microRNAs and RNA-binding proteins and plays a key role in cell-specific mRNA stability and expression. We provide a well-validated option, the human alpha-globin (HBA1; Gene ID 3039) 3' UTR sequence that has been validated in different cell types and applications. By default, no 3' UTR will be added."
              }
            >
              <Stack>
                <SegmentedControl
                  data={[
                    {
                      label: "Human alpha-globin",
                      value: "human-alpha-globin",
                    },
                    { label: "Custom", value: "custom" },
                  ]}
                  value={threePrimeUTRSequenceType}
                  onChange={(v) =>
                    setThreePrimeUTRSequenceType(
                      v as typeof threePrimeUTRSequenceType,
                    )
                  }
                />
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
              </Stack>
            </InputWrapper>
          </Fieldset>
          <Fieldset legend="Poly(A) tail">
            <InputWrapper
              description={
                showHelp &&
                "Specify the length of the poly(A) tail or alternatively paste more complex designs. The length of the poly(A) tail plays a critical role in mRNA translation and stability. By default, no poly(A) tail will be added."
              }
            >
              <Stack>
                <SegmentedControl
                  data={[
                    { label: "None", value: "none" },
                    { label: "Generate", value: "generate" },
                    { label: "Custom", value: "custom" },
                  ]}
                  value={polyATailType}
                  onChange={(v) => setPolyATailType(v as typeof polyATailType)}
                />
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
              </Stack>
            </InputWrapper>
          </Fieldset>
        </Stack>
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
      <div>
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
      </div>
    </>
  );
};
