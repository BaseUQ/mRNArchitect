import { getUserDetailsLocalStorage } from "~/context/UserDetails";

export const api = (input: string, init?: RequestInit) => {
  const userDetails = getUserDetailsLocalStorage();

  return fetch(apiUrl(input), {
    ...init,
    headers: {
      "X-mRNArchitect-Email": userDetails.email,
      "X-mRNArchitect-Name": userDetails.name,
      "X-mRNArchitect-Organization": userDetails.organization,
    },
  });
};

/**
 * Generate API URL.
 */
const apiUrl = (path: string) => {
  const url = `${import.meta.env.VITE_API ?? ""}${path}`;

  const urlParams = new URLSearchParams(window.location.search);
  const user = urlParams.get("user");
  if (user) {
    return `${url}?user=${encodeURIComponent(user)}`;
  }

  return url;
};

/**
 * Remove all whitespace/newlines and upper case the sequence.
 */
export const sanitizeSequence = (v: string) =>
  v.replaceAll(/\s/gim, "").toUpperCase();

/**
 * Remove all whitespace/newlines, upper case the sequence and convert 'U' to 'T'.
 */
export const sanitizeNucleicAcidSequence = (v: string) =>
  sanitizeSequence(v).replaceAll("U", "T");
