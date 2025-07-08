import { Input, SegmentedControl, Stack, Textarea } from "@mantine/core";
import { useState } from "react";

const HELP = {
  fivePrimeUtr:
    "Paste your 5' untranslated sequence here. The 5' untranslated region (UTR) is bound and scanned by the ribosome and is needed for translation. We provide a well-validated option, the human alpha-globin (HBA1; Gene ID 3039) 5' UTR sequence that has been validated in different cell types and applications. By default, no 5' UTR will be added.",
  codingSequence:
    "Add your coding sequence of interest here. You can paste either the amino acid, RNA or DNA sequence. You may also want to consider adding useful sequence elements such as nuclear localization signals, signal peptides, or other tags. Ensure your coding sequence starts with a MET codon and ends with a STOP codon. You may want to use two different stop codons for efficient termination (e.g., UAG/UGA).",
  threePrimeUtr:
    "Paste your 3' untranslated sequence here. The 3' untranslated region (UTR) is regulated by microRNAs and RNA-binding proteins and plays a key role in cell-specific mRNA stability and expression. We provide a well-validated option, the human alpha-globin (HBA1; Gene ID 3039) 3' UTR sequence that has been validated in different cell types and applications. By default, no 3' UTR will be added.",
  polyATail:
    "Specify the length of the poly(A) tail or alternatively paste more complex designs. The length of the poly(A) tail plays a critical role in mRNA translation and stability. By default, no poly(A) tail will be added.",
};

interface SequenceInputProps {}

const parseSequence = (
  input: string,
  type: "nucleic-acid" | "amino-acid" = "nucleic-acid",
): string => {
  if (type === "nucleic-acid") {
    return input
      .toUpperCase()
      .replaceAll("U", "T")
      .replaceAll(/[^ACGT]/gi, "");
  }
  return input.toUpperCase().replaceAll(/[^ARNDCEQGHIKMFPSTWYV\*]/gi, "");
};

export const SequenceInput = (props: SequenceInputProps) => {
  const [fivePrimeUtrType, setFivePrimeUtrType] = useState<string>("none");
  const [fivePrimeUtr, setFivePrimeUtr] = useState<string>("");

  const [codingSequenceType, setCodingSequenceType] =
    useState<string>("nucleic-acid");
  const [codingSequence, setCodingSequence] = useState<string>("");

  const [threePrimeUtrType, setThreePrimeUtrType] = useState<string>("none");
  const [threePrimeUtr, setThreePrimeUtr] = useState<string>("");

  const [polyATailType, setPolyATailType] = useState<string>("none");
  const [polyATail, setPolyATail] = useState<string>("");

  return (
    <Stack>
      <Input.Wrapper label="5' UTR">
        <Stack align="flex-start" gap="xs">
          <SegmentedControl
            data={[
              { label: "None", value: "none" },
              { label: "Human alpha-globin", value: "human-alpha-globin" },
              { label: "Custom", value: "custom" },
            ]}
            value={fivePrimeUtrType}
            onChange={setFivePrimeUtrType}
          />
          {fivePrimeUtrType != "none" && (
            <Textarea
              value={fivePrimeUtr}
              onChange={(e) =>
                setFivePrimeUtr(
                  parseSequence(e.currentTarget.value, "nucleic-acid"),
                )
              }
              disabled={fivePrimeUtrType !== "custom"}
              autosize
              resize="vertical"
              w="100%"
            />
          )}
        </Stack>
      </Input.Wrapper>
      <Input.Wrapper label="Coding sequence">
        <Stack align="flex-start" gap="xs">
          <SegmentedControl
            data={[
              { label: "Nucleic acid", value: "nucleic-acid" },
              { label: "Amino acid", value: "amino-acid" },
            ]}
            value={codingSequenceType}
            onChange={setCodingSequenceType}
          />
          <Textarea
            value={codingSequence}
            onChange={(e) =>
              setCodingSequence(
                parseSequence(e.currentTarget.value, codingSequenceType),
              )
            }
            autosize
            resize="vertical"
            minRows={5}
            withAsterisk
            w="100%"
          />
        </Stack>
      </Input.Wrapper>
    </Stack>
  );
};
