import http from "../http";
import { wrap } from "../wrap";
import type { OnlineBudget } from "../../types";

export const onlineBudgetsApi = {
  list: (skip = 0, limit = 100) => wrap<OnlineBudget[]>(() => http.get("/online-budgets", { params: { skip, limit } })),
  get: (id: number) => wrap<OnlineBudget>(() => http.get(`/online-budgets/${id}`)),
  create: (data: any) => wrap<OnlineBudget>(() => http.post("/online-budgets", data)),
  update: (id: number, data: any) => wrap<OnlineBudget>(() => http.put(`/online-budgets/${id}`, data)),
  delete: (id: number) => http.delete(`/online-budgets/${id}`),
};
