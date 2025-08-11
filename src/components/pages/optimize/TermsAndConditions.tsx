import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { loadTermsAndConditions } from "~/server/static";

export const TermsAndConditions = () => {
  const [termsAndConditions, setTermsAndConditions] = useState<string>();

  useEffect(() => {
    loadTermsAndConditions().then(setTermsAndConditions);
  }, []);

  return <Markdown>{termsAndConditions}</Markdown>;
};
