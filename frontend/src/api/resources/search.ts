import http from "../http";
import { wrap } from "../wrap";
import type { SearchResults } from "../../types";

export const searchApi = {
  all: (q: string) => wrap<SearchResults>(() => http.get("/search", { params: { q } })),
};
