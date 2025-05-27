import { Textarea, type TextareaProps } from "@mantine/core";

interface SequenceInputProps extends TextareaProps {
  type: "nucleic-acid" | "amino-acid" | "both";
}

export const SequenceInput = ({ type, ...props }: SequenceInputProps) => {
  return <Textarea {...props} />;
};
