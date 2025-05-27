import { ChangeEventHandler, KeyboardEvent, useState } from "react";
import { Textarea, type TextareaProps } from "@mantine/core";

interface SequenceInputProps extends TextareaProps {
  type: "nucleic-acid" | "amino-acid" | "both";
  value?: string;
}

const NUCLEIC_ACID_REGEX = /^[ACGTU]*$/g;

const AMINO_ACID_REGEX = /^[ACDEFGHIKLMNPQRSTVWY*]*$/g;

const isValidNucleotide = (s: string): boolean =>
  NUCLEIC_ACID_REGEX.exec(s) === null;

const isValidAminoAcid = (s: string): boolean =>
  AMINO_ACID_REGEX.exec(s) === null;

export const SequenceInput = ({ type, ...props }: SequenceInputProps) => {
  const [value, setValue] = useState<string>(props.value || "");

  const handleOnChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    let newValue = e.currentTarget.value.toUpperCase();
    if (type === "amino-acid") {
      newValue = "";
    }
  };

  return <Textarea {...props} value={value} onChange={handleOnChange} />;
};
