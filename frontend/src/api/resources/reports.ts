import http from "../http";
import { wrap } from "../wrap";
import type { DashboardStats, Budget, WorkOrder } from "../../types";

export const reportsApi = {
  dashboard: () => wrap<DashboardStats>(() => http.get("/reports/dashboard")),
  budgetsByStatus: (status: string) => wrap<Budget[]>(() => http.get("/reports/budgets-by-status", { params: { status } })),
  workOrdersByStatus: (status: string) => wrap<WorkOrder[]>(() => http.get("/reports/work-orders-by-status", { params: { status } })),
  monthlySales: (year?: number) =>
    wrap<{ month: string; total: number; total_usd: number }[]>(() => http.get("/reports/monthly-sales", { params: year ? { year } : {} })),
  mostUsedMaterials: (limit = 10) =>
    wrap<{ name: string; usage_count: number }[]>(() => http.get("/reports/most-used-materials", { params: { limit } })),
};
