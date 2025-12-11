import z from "zod/v4";
import { apiUrl } from "../utils";

export const SearchOrganismsRequest = z.object({
  terms: z.string().nonempty(),
});

export type SearchOrganismsRequest = z.infer<typeof SearchOrganismsRequest>;

export const SearchOrganismsResponse = z.object({
  organisms: z.array(
    z.object({
      slug: z.string().nonempty(),
      name: z.string().nonempty(),
      kazusa_id: z.string().nonempty(),
    }),
  ),
});

export type SearchOrganismsResponse = z.infer<typeof SearchOrganismsResponse>;

export const searchOrganisms = (data: SearchOrganismsRequest) =>
  fetch(apiUrl("/api/search-organisms"), {
    method: "POST",
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((json) => SearchOrganismsResponse.parse(json));
