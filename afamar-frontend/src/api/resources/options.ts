import http from "@/api/http";
import { wrap } from "@/api/wrap";
import type { AppOption } from "@/types";

export const optionsApi = {
  list: (category?: string) => wrap<AppOption[]>(() => http.get("/options", { params: category ? { category } : {} })),
  create: (data: { category: string; value: string }) => wrap<AppOption>(() => http.post("/options", data)),
  delete: (id: number) => http.delete(`/options/${id}`),
};
