import { useEffect, useState } from "react";
import { Fieldset, Group, NumberInput, Radio, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  TextareaWithRequirements,
  type TextareaWithRequirementsProps,
} from "~/components/inputs/TextareaWithRequirements";
import {
  FIVE_PRIME_HUMAN_ALPHA_GLOBIN,
  THREE_PRIME_HUMAN_ALPHA_GLOBIN,
} from "~/constants";

const REQUIREMENT_NUCLEIC_ACID_IS_AMINO_ACID: TextareaWithRequirementsProps["requirements"][0] =
  (sequence: string) => ({
    label: "Nucleic acid sequence must be a valid amino acid sequence.",
    status: sequence.length > 0 && sequence.length % 3 === 0 ? "ok" : "error",
  });
const REQUIREMENT_NUCLEIC_ACID_HAS_CORRECT_CHARACTERS: TextareaWithRequirementsProps["requirements"][0] =
  (sequence: string) => ({
    label: "Nucleic acid sequence must only contain A, C, G, T or U.",
    status:
      sequence.length > 0 && sequence.search(/[^ACGTU]/gim) === -1
        ? "ok"
        : "error",
  });
const REQUIREMENT_NUCLEIC_ACID_HAS_START_CODON: TextareaWithRequirementsProps["requirements"][0] =
  (sequence: string) => ({
    label: "Start codon (AUG) should be present (optional).",
    status: sequence.search(/^(A[TU]G)/gim) === 0 ? "ok" : "none",
  });
const REQUIREMENT_NUCLEIC_ACID_HAS_STOP_CODON: TextareaWithRequirementsProps["requirements"][0] =
  (sequence: string) => ({
    label: "Stop codon (UAG, UAA or UGA) should be present (optional).",
    status:
      sequence.search(/([TU]AG)$|([TU]AA)$|([TU]GA)$/gim) !== -1
        ? "ok"
        : "none",
  });
const REQUIREMENT_AMINO_ACID_HAS_CORRECT_CHARACTERS: TextareaWithRequirementsProps["requirements"][0] =
  (sequence: string) => ({
    label: "Sequence must only contain valid amino acids.",
    status:
      sequence.length > 0 &&
      sequence.search(/[^ARNDCEQGHILKMFPSTWYV\*]/gim) === -1
        ? "ok"
        : "error",
  });
const REQUIREMENT_AMINO_ACID_HAS_START_CODON: TextareaWithRequirementsProps["requirements"][0] =
  (sequence: string) => ({
    label: "Start codon (M) should be present (optional).",
    status: sequence.search(/^(M)/gim) === 0 ? "ok" : "none",
  });
const REQUIREMENT_AMINO_ACID_HAS_STOP_CODON: TextareaWithRequirementsProps["requirements"][0] =
  (sequence: string) => ({
    label: "Stop codon (*) should be present (optional).",
    status: sequence.search(/(\*)$/gim) !== -1 ? "ok" : "none",
  });

export interface Sequence {
  codingSequenceType: "nucleic-acid" | "amino-acid";
  codingSequence: string;
  fivePrimeUTR: string;
  threePrimeUTR: string;
  polyATail: string;
}

export interface OptimizationSequenceProps {
  sequence: Sequence;
  onChange: (sequence: Sequence) => void;
}

export const OptimizationSequence = ({
  sequence,
  onChange,
}: OptimizationSequenceProps) => {
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

  useEffect(() => {
    if (fivePrimeUTRSequenceType === "human-alpha-globin") {
      onChange({ ...sequence, fivePrimeUTR: FIVE_PRIME_HUMAN_ALPHA_GLOBIN });
    }
  }, [fivePrimeUTRSequenceType]);

  useEffect(() => {
    if (threePrimeUTRSequenceType === "human-alpha-globin") {
      onChange({ ...sequence, threePrimeUTR: THREE_PRIME_HUMAN_ALPHA_GLOBIN });
    }
  }, [threePrimeUTRSequenceType]);

  useEffect(() => {
    if (polyATailType === "none") {
      onChange({ ...sequence, polyATail: " " });
    } else if (polyATailType === "generate") {
      const length =
        typeof polyATailGenerate === "string"
          ? parseInt(polyATailGenerate)
          : polyATailGenerate;
      onChange({ ...sequence, polyATail: "A".repeat(length) });
    }
  }, [polyATailType, polyATailGenerate]);

  return (
    <Fieldset>
      <Stack>
        <div>
          <Radio.Group
            label="Coding sequence"
            description={
              "Add your coding sequence of interest here. You can paste either the amino acid, RNA or DNA sequence. You may also want to consider adding useful sequence elements such as nuclear localization signals, signal peptides, or other tags. Ensure your coding sequence starts with a MET codon and ends with a STOP codon. You may want to use two different stop codons for efficient termination (e.g., UAG/UGA)."
            }
            withAsterisk
            value={sequence.codingSequenceType}
            onChange={(v) =>
              onChange({
                ...sequence,
                codingSequenceType: v as Sequence["codingSequenceType"],
              })
            }
          >
            <Group style={{ padding: "5px" }}>
              <Radio value="nucleic-acid" label="Nucleic acid" />
              <Radio value="amino-acid" label="Amino acid" />
            </Group>
          </Radio.Group>
          <TextareaWithRequirements
            requirements={
              sequence.codingSequenceType === "nucleic-acid"
                ? [
                    REQUIREMENT_NUCLEIC_ACID_IS_AMINO_ACID,
                    REQUIREMENT_NUCLEIC_ACID_HAS_CORRECT_CHARACTERS,
                    REQUIREMENT_NUCLEIC_ACID_HAS_START_CODON,
                    REQUIREMENT_NUCLEIC_ACID_HAS_STOP_CODON,
                  ]
                : [
                    REQUIREMENT_AMINO_ACID_HAS_CORRECT_CHARACTERS,
                    REQUIREMENT_AMINO_ACID_HAS_START_CODON,
                    REQUIREMENT_AMINO_ACID_HAS_STOP_CODON,
                  ]
            }
            spellCheck={false}
            label="Coding sequence textarea"
            labelProps={{ display: "none" }}
            placeholder="Paste your sequence here..."
            autosize
            minRows={5}
            resize="vertical"
            withAsterisk
            value={sequence.codingSequence}
            onChange={(e) =>
              onChange({ ...sequence, codingSequence: e.currentTarget.value })
            }
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
              setFivePrimeUTRSequenceType(v as typeof fivePrimeUTRSequenceType)
            }
          >
            <Group style={{ padding: "5px" }}>
              <Radio value="human-alpha-globin" label="Human alpha-globin" />
              <Radio value="custom" label="Custom" />
            </Group>
          </Radio.Group>
          <TextareaWithRequirements
            requirements={[REQUIREMENT_NUCLEIC_ACID_HAS_CORRECT_CHARACTERS]}
            spellCheck={false}
            disabled={fivePrimeUTRSequenceType === "human-alpha-globin"}
            placeholder="Paste your sequence here..."
            autosize
            minRows={2}
            resize="vertical"
            value={sequence.fivePrimeUTR}
            onChange={(e) =>
              onChange({ ...sequence, fivePrimeUTR: e.currentTarget.value })
            }
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
              <Radio value="human-alpha-globin" label="Human alpha-globin" />
              <Radio value="custom" label="Custom" />
            </Group>
          </Radio.Group>
          <TextareaWithRequirements
            requirements={[REQUIREMENT_NUCLEIC_ACID_HAS_CORRECT_CHARACTERS]}
            spellCheck={false}
            disabled={threePrimeUTRSequenceType === "human-alpha-globin"}
            placeholder="Paste your sequence here..."
            autosize
            minRows={2}
            resize="vertical"
            value={sequence.threePrimeUTR}
            onChange={(e) =>
              onChange({ ...sequence, threePrimeUTR: e.currentTarget.value })
            }
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
            <TextareaWithRequirements
              requirements={[REQUIREMENT_NUCLEIC_ACID_HAS_CORRECT_CHARACTERS]}
              spellCheck={false}
              placeholder="Paste your sequence here..."
              autosize
              minRows={2}
              resize="vertical"
              value={sequence.polyATail}
              onChange={(e) =>
                onChange({ ...sequence, polyATail: e.currentTarget.value })
              }
            />
          )}
        </div>
      </Stack>
    </Fieldset>
  );
};
