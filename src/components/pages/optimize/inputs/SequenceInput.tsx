import {
  Button,
  Group,
  InputWrapper,
  NativeSelect,
  NumberInput,
  SegmentedControl,
  Stack,
  Textarea,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { useState } from "react";
import type { OptimizationInput } from "~/components/pages/optimize/types";
import { EGFP, FIVE_PRIME_UTRS, THREE_PRIME_UTRS } from "~/constants";
import type { Sequence } from "~/types/sequence";

export interface SequenceFormProps {
  initialSequence?: Sequence;
  onSave: (sequence: Sequence) => void;
}

export const SequenceInput = ({
  form,
}: {
  form: UseFormReturnType<OptimizationInput>;
}) => {
  const [fivePrimeUTRSequenceType, setFivePrimeUTRSequenceType] =
    useState<string>("");
  const [threePrimeUTRSequenceType, setThreePrimeUTRSequenceType] =
    useState<string>("");
  const [polyATailType, setPolyATailType] = useState<
    "none" | "generate" | "custom"
  >("none");
  const [polyATailGenerate, setPolyATailGenerate] = useState<string | number>(
    120,
  );

  const handleOnChangeFivePrimeUtrSequenceType = (v: string) => {
    setFivePrimeUTRSequenceType(v);
    form.setFieldValue("sequence.fivePrimeUtr", v);
  };

  const handleOnChangeThreePrimeUtrSequenceType = (v: string) => {
    setThreePrimeUTRSequenceType(v);
    form.setFieldValue("sequence.threePrimeUtr", v);
  };

  const handleOnChangePolyATailType = (v: string) => {
    setPolyATailType(v as typeof polyATailType);
    if (v === "none") {
      form.setFieldValue("sequence.polyATail", "");
    } else if (v === "generate") {
      const length =
        typeof polyATailGenerate === "string"
          ? Number.parseInt(polyATailGenerate)
          : polyATailGenerate;
      form.setFieldValue("sequence.polyATail", "A".repeat(length));
    }
  };

  return (
    <Stack>
      <InputWrapper label="Coding sequence" required>
        <Stack>
          <Group grow>
            <SegmentedControl
              data={[
                { label: "Nucleic acid", value: "nucleic-acid" },
                { label: "Amino acid", value: "amino-acid" },
              ]}
              key={form.key("sequence.codingSequenceType")}
              {...form.getInputProps("sequence.codingSequenceType")}
            />
            <Button
              size="xs"
              variant="light"
              onClick={() => {
                form.setFieldValue("sequence.codingSequenceType", "amino-acid");
                form.setFieldValue("sequence.codingSequence", EGFP);
              }}
            >
              Pre-fill example sequence (eGFP)
            </Button>
          </Group>
          <Textarea
            spellCheck={false}
            label="Coding sequence textarea"
            labelProps={{ display: "none" }}
            placeholder="Paste your sequence here..."
            autosize
            minRows={5}
            resize="vertical"
            withAsterisk
            key={form.key("sequence.codingSequence")}
            {...form.getInputProps("sequence.codingSequence")}
          />
        </Stack>
      </InputWrapper>
      <InputWrapper label="5' UTR">
        <Stack>
          <NativeSelect
            data={[...FIVE_PRIME_UTRS, { label: "Custom", value: "" }]}
            value={fivePrimeUTRSequenceType}
            onChange={(e) =>
              handleOnChangeFivePrimeUtrSequenceType(e.currentTarget.value)
            }
          />
          <Textarea
            spellCheck={false}
            disabled={fivePrimeUTRSequenceType !== ""}
            placeholder="Paste your sequence here..."
            autosize
            minRows={2}
            resize="vertical"
            key={form.key("sequence.fivePrimeUtr")}
            {...form.getInputProps("sequence.fivePrimeUtr")}
          />
        </Stack>
      </InputWrapper>
      <InputWrapper label="3' UTR">
        <Stack>
          <NativeSelect
            data={[...THREE_PRIME_UTRS, { label: "Custom", value: "" }]}
            value={threePrimeUTRSequenceType}
            onChange={(e) =>
              handleOnChangeThreePrimeUtrSequenceType(e.currentTarget.value)
            }
          />

          <Textarea
            spellCheck={false}
            disabled={threePrimeUTRSequenceType !== ""}
            placeholder="Paste your sequence here..."
            autosize
            minRows={2}
            resize="vertical"
            key={form.key("sequence.threePrimeUtr")}
            {...form.getInputProps("sequence.threePrimeUtr")}
          />
        </Stack>
      </InputWrapper>
      <InputWrapper label="Poly(A) tail">
        <Stack>
          <SegmentedControl
            data={[
              { label: "None", value: "none" },
              { label: "Generate", value: "generate" },
              { label: "Custom", value: "custom" },
            ]}
            value={polyATailType}
            onChange={handleOnChangePolyATailType}
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
          {polyATailType !== "generate" && (
            <Textarea
              disabled={polyATailType === "none"}
              spellCheck={false}
              placeholder={
                polyATailType === "none" ? "" : "Paste your sequence here..."
              }
              autosize
              minRows={1}
              resize="vertical"
              key={form.key("sequence.polyATail")}
              {...form.getInputProps("sequence.polyATail")}
            />
          )}
        </Stack>
      </InputWrapper>
    </Stack>
  );
};
