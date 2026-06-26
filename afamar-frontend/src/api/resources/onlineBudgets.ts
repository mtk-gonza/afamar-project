import http from "@/api/http";
import { wrap } from "@/api/wrap";
import type { CreateOnlineBudgetInput, OnlineBudget, WorkOrder } from "@/types";

export const onlineBudgetsApi = {
  list: (skip = 0, limit = 100) => wrap<OnlineBudget[]>(() => http.get("/online-budgets", { params: { skip, limit } })),
  get: (id: number) => wrap<OnlineBudget>(() => http.get(`/online-budgets/${id}`)),
  create: (data: CreateOnlineBudgetInput) => wrap<OnlineBudget>(() => http.post("/online-budgets", data)),
  update: (id: number, data: Partial<CreateOnlineBudgetInput>) => wrap<OnlineBudget>(() => http.put(`/online-budgets/${id}`, data)),
  delete: (id: number) => http.delete(`/online-budgets/${id}`),
  convertToWorkOrder: (id: number) => wrap<WorkOrder>(() => http.post(`/online-budgets/${id}/convert-to-work-order`)),
  sendWhatsApp: (id: number, phone: string) => wrap<any>(() => http.post(`/online-budgets/${id}/send-whatsapp`, { phone })),
};
