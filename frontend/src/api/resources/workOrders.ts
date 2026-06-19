import http from "../http";
import { wrap } from "../wrap";
import type { WorkOrder } from "../../types";

export const workOrdersApi = {
  list: (skip = 0, limit = 100, status?: string, client_id?: number) =>
    wrap<WorkOrder[]>(() => http.get("/work-orders", { params: { skip, limit, status, client_id } })),
  get: (id: number) => wrap<WorkOrder>(() => http.get(`/work-orders/${id}`)),
  search: (q: string) => wrap<WorkOrder[]>(() => http.get("/work-orders/search", { params: { q } })),
  create: (data: any) => wrap<WorkOrder>(() => http.post("/work-orders", data)),
  createFromBudget: (budgetId: number) => wrap<WorkOrder>(() => http.post(`/work-orders/from-budget/${budgetId}`)),
  update: (id: number, data: any) => wrap<WorkOrder>(() => http.put(`/work-orders/${id}`, data)),
  delete: (id: number) => http.delete(`/work-orders/${id}`),
};
