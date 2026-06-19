import http from "../http";
import { wrap } from "../wrap";
import type { Budget } from "../../types";

export const budgetsApi = {
  list: (skip = 0, limit = 100, status?: string, client_id?: number) =>
    wrap<Budget[]>(() => http.get("/budgets", { params: { skip, limit, status, client_id } })),
  get: (id: number) => wrap<Budget>(() => http.get(`/budgets/${id}`)),
  search: (q: string) => wrap<Budget[]>(() => http.get("/budgets/search", { params: { q } })),
  create: (data: any) => wrap<Budget>(() => http.post("/budgets", data)),
  update: (id: number, data: any) => wrap<Budget>(() => http.put(`/budgets/${id}`, data)),
  delete: (id: number) => http.delete(`/budgets/${id}`),
  downloadPdf: (id: number) => http.get(`/budgets/${id}/pdf`, { responseType: "blob" }).then((r) => r.data),
  sendEmail: (id: number) => wrap<{ message: string }>(() => http.post(`/budgets/${id}/send-email`)),
};
