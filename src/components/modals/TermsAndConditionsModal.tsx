import { Modal, ModalProps } from "@mantine/core";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { loadTermsAndConditions } from "~/server/static";

export const TermsAndConditionsModal = (props: ModalProps) => {
  const [termsAndConditions, setTermsAndConditions] = useState<string>();

  useEffect(() => {
    loadTermsAndConditions().then(setTermsAndConditions);
  }, []);

  return (
    <Modal size="xl" {...props}>
      {termsAndConditions && <Markdown>{termsAndConditions}</Markdown>}
    </Modal>
  );
};
