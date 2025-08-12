import { createServerFn } from "@tanstack/react-start";
import { readFileAsync } from "./utils";

export const loadTermsAndConditions = createServerFn({
  method: "GET",
}).handler(async () => {
  const data = await readFileAsync("TERMS.md");
  return data.toString();
});
