import {
  Button,
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
import {
  EGFP,
  FIVE_PRIME_HUMAN_ALPHA_GLOBIN,
  THREE_PRIME_HUMAN_ALPHA_GLOBIN,
  FIVE_PRIME_UTRS,
} from "~/constants";
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
  const [threePrimeUTRSequenceType, setThreePrimeUTRSequenceType] = useState<
    "human-alpha-globin" | "custom"
  >("custom");
  const [polyATailType, setPolyATailType] = useState<
    "none" | "generate" | "custom"
  >("none");
  const [polyATailGenerate, setPolyATailGenerate] = useState<string | number>(
    120,
  );

  const handleOnChangeFivePrimeUTRSequenceType = (v: string) => {
    setFivePrimeUTRSequenceType(v);
    form.setFieldValue("sequence.fivePrimeUTR", v);
  };

  const handleOnChangeThreePrimeUTRSequenceType = (v: string) => {
    setThreePrimeUTRSequenceType(v as typeof threePrimeUTRSequenceType);
    if (v === "human-alpha-globin") {
      form.setFieldValue(
        "sequence.threePrimeUTR",
        THREE_PRIME_HUMAN_ALPHA_GLOBIN,
      );
    }
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
          <SegmentedControl
            data={[
              { label: "Nucleic acid", value: "nucleic-acid" },
              { label: "Amino acid", value: "amino-acid" },
            ]}
            key={form.key("sequence.codingSequenceType")}
            {...form.getInputProps("sequence.codingSequenceType")}
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
            key={form.key("sequence.codingSequence")}
            {...form.getInputProps("sequence.codingSequence")}
          />
        </Stack>
      </InputWrapper>
      <Button
        variant="outline"
        onClick={() => {
          form.setFieldValue("sequence.codingSequenceType", "amino-acid");
          form.setFieldValue("sequence.codingSequence", EGFP);
        }}
      >
        Pre-fill example sequence (eGFP)
      </Button>

      <InputWrapper label="5' UTR">
        <Stack>
          <NativeSelect
            data={[...FIVE_PRIME_UTRS, { label: "Custom", value: "" }]}
            value={fivePrimeUTRSequenceType}
            onChange={(e) =>
              handleOnChangeFivePrimeUTRSequenceType(e.currentTarget.value)
            }
          />
          <Textarea
            spellCheck={false}
            disabled={fivePrimeUTRSequenceType !== ""}
            placeholder="Paste your sequence here..."
            autosize
            minRows={2}
            resize="vertical"
            key={form.key("sequence.fivePrimeUTR")}
            {...form.getInputProps("sequence.fivePrimeUTR")}
          />
        </Stack>
      </InputWrapper>
      <InputWrapper label="3' UTR">
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
            onChange={handleOnChangeThreePrimeUTRSequenceType}
          />
          <Textarea
            spellCheck={false}
            disabled={threePrimeUTRSequenceType === "human-alpha-globin"}
            placeholder="Paste your sequence here..."
            autosize
            minRows={2}
            resize="vertical"
            key={form.key("sequence.threePrimeUTR")}
            {...form.getInputProps("sequence.threePrimeUTR")}
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
