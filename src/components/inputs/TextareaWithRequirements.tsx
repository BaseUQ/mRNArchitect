import { Group, Popover, Text, Textarea, TextareaProps } from "@mantine/core";
import {
  CheckIcon,
  ExclamationMarkIcon,
  MinusIcon,
  XIcon,
} from "@phosphor-icons/react";
import { ReactElement, useRef, useState } from "react";

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
