import { createServerFn } from "@tanstack/react-start";
import { readFileAsync } from "./utils";

export const loadTermsAndConditions = createServerFn({
  type: "static",
}).handler(async () => {
  const data = await readFileAsync("../../TERMS_AND_CONDITIONS.md");
  return data.toString();
});
