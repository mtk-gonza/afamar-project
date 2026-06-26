import http from "@/api/http";
import { wrap } from "@/api/wrap";
import type { WorkOrder } from "@/types";

export const workOrdersApi = {
  list: (skip = 0, limit = 100, status?: string, client_id?: number) =>
    wrap<WorkOrder[]>(() => http.get("/work-orders", { params: { skip, limit, status, client_id } })),
  get: (id: number) => wrap<WorkOrder>(() => http.get(`/work-orders/${id}`)),
  nextNumber: () => wrap<{ number: string }>(() => http.get("/work-orders/next-number")),
  search: (q: string) => wrap<WorkOrder[]>(() => http.get("/work-orders/search", { params: { q } })),
  create: (data: any) => wrap<WorkOrder>(() => http.post("/work-orders", data)),
  createFromBudget: (budgetId: number) => wrap<WorkOrder>(() => http.post(`/work-orders/from-budget/${budgetId}`)),
  update: (id: number, data: any) => wrap<WorkOrder>(() => http.put(`/work-orders/${id}`, data)),
  updateStatus: (id: number, status: string) => wrap<WorkOrder>(() => http.put(`/work-orders/${id}`, { status })),
  delete: (id: number) => http.delete(`/work-orders/${id}`),
};
