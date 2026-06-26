import http from "@/api/http";
import { wrap } from "@/api/wrap";
import type { SearchResults } from "@/types";

export const searchApi = {
  all: (q: string) => wrap<SearchResults>(() => http.get("/search", { params: { q } })),
};
