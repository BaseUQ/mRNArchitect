import {
  Group,
  Input,
  Popover,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextareaProps,
} from "@mantine/core";
import {
  CheckIcon,
  ExclamationMarkIcon,
  MinusIcon,
  XIcon,
} from "@phosphor-icons/react";
import { ReactElement, useCallback, useRef, useState } from "react";

interface SequenceInputProps extends TextareaProps {
  sequenceType: "nucleic-acid" | "amino-acid";
}

const parseSequence = (
  input: string,
  type: SequenceInputProps["sequenceType"],
): string => {
  if (type === "nucleic-acid") {
    return input
      .toUpperCase()
      .replaceAll("U", "T")
      .replaceAll(/[^ACGT]/gi, "");
  }
  return input.toUpperCase().replaceAll(/[^ARNDCEQGHIKMFPSTWYV\*]/gi, "");
};

interface RequirementProps {
  label: string;
  status: "ok" | "warning" | "error" | "none";
}

const Requirement = ({ label, status }: RequirementProps) => {
  const COLOR_MAP: Record<typeof status, string> = {
    ok: "green",
    warning: "yellow",
    error: "red",
    none: "grey",
  };

  const ICON_MAP: Record<typeof status, ReactElement> = {
    ok: <CheckIcon size={14} />,
    warning: <ExclamationMarkIcon size={14} />,
    error: <XIcon size={14} />,
    none: <MinusIcon size={14} />,
  };

  return (
    <Group c={COLOR_MAP[status]} align="center">
      {ICON_MAP[status]}
      <Text size="sm">{label}</Text>
    </Group>
  );
};

export interface TextareaWithRequirementsProps extends TextareaProps {
  requirements: Array<(value: string) => RequirementProps>;
}

const REQUIREMENTS: Record<
  SequenceInputProps["sequenceType"],
  Array<(sequence: string) => RequirementProps>
> = {
  "nucleic-acid": [
    (sequence) => ({
      label: "Nucleic acid sequence must be a valid amino acid sequence.",
      status: sequence.length > 0 && sequence.length % 3 === 0 ? "ok" : "error",
    }),
    (sequence) => ({
      label: "Nucleic acid sequence must only contain A, C, G, T or U.",
      status:
        sequence.length > 0 && sequence.search(/[^ACGTU]/gim) === -1
          ? "ok"
          : "error",
    }),
    (sequence) => ({
      label: "Start codon (AUG) should be present (optional).",
      status: sequence.search(/^(A[TU]G)/gim) === 0 ? "ok" : "none",
    }),
    (sequence) => ({
      label: "Stop codon (UAG, UAA or UGA) should be present (optional).",
      status:
        sequence.search(/([TU]AG)$|([TU]AA)$|([TU]GA)$/gim) !== -1
          ? "ok"
          : "none",
    }),
  ],
  "amino-acid": [
    (sequence) => ({
      label: "Sequence must only contain valid amino acids.",
      status:
        sequence.length > 0 &&
        sequence.search(/[^ARNDCEQGHILKMFPSTWYV\*]/gim) === -1
          ? "ok"
          : "error",
    }),
    (sequence) => ({
      label: "Start codon (M) should be present (optional).",
      status: sequence.search(/^(M)/gim) === 0 ? "ok" : "none",
    }),
    (sequence) => ({
      label: "Stop codon (*) should be present (optional).",
      status: sequence.search(/(\*)$/gim) !== -1 ? "ok" : "none",
    }),
  ],
};

export const TextareaWithRequirements = ({
  requirements = [],
  ...props
}: TextareaWithRequirementsProps) => {
  const [popoverOpened, setPopoverOpened] = useState<boolean>(false);

  const ref = useRef<HTMLTextAreaElement | null>(null);

  const requirementProps = requirements.map((requirement) =>
    requirement(ref.current?.value.replaceAll(/\s/gi, "") ?? ""),
  );

  return (
    <Popover
      opened={popoverOpened}
      position="bottom-start"
      transitionProps={{ transition: "pop" }}
    >
      <Popover.Target>
        <div
          onFocusCapture={() => setPopoverOpened(true)}
          onBlurCapture={() => setPopoverOpened(false)}
        >
          <Textarea {...props} ref={ref} />
        </div>
      </Popover.Target>
      {requirementProps.length > 0 && (
        <Popover.Dropdown>
          {requirementProps.map((p) => (
            <Requirement {...p} />
          ))}
        </Popover.Dropdown>
      )}
    </Popover>
  );
};
