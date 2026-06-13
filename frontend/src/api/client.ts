import http from "./http";
import type {
  Budget, Client, DashboardStats, Material, MaterialCategory, MaterialColor, MaterialThickness,
  AppOption, PoolStock, SettingsData, WorkOrder,
} from "../types";

const wrap = <T>(fn: () => Promise<any>): Promise<T> => fn().then((r) => r.data);

export const api = {
  // Clients
  getClients: (skip = 0, limit = 100) => wrap<Client[]>(() => http.get("/clients", { params: { skip, limit } })),
  getClient: (id: number) => wrap<Client>(() => http.get(`/clients/${id}`)),
  searchClients: (q: string) => wrap<Client[]>(() => http.get("/clients/search", { params: { q } })),
  createClient: (data: any) => wrap<Client>(() => http.post("/clients", data)),
  updateClient: (id: number, data: any) => wrap<Client>(() => http.put(`/clients/${id}`, data)),
  deleteClient: (id: number) => http.delete(`/clients/${id}`),

  // Budgets
  getBudgets: (skip = 0, limit = 100) => wrap<Budget[]>(() => http.get("/budgets", { params: { skip, limit } })),
  getBudget: (id: number) => wrap<Budget>(() => http.get(`/budgets/${id}`)),
  createBudget: (data: any) => wrap<Budget>(() => http.post("/budgets", data)),
  createFromBudget: (budgetId: number) => wrap<WorkOrder>(() => http.post(`/work-orders/from-budget/${budgetId}`)),
  updateBudget: (id: number, data: any) => wrap<Budget>(() => http.put(`/budgets/${id}`, data)),
  deleteBudget: (id: number) => http.delete(`/budgets/${id}`),

  // Work Orders
  getWorkOrders: (skip = 0, limit = 100) => wrap<WorkOrder[]>(() => http.get("/work-orders", { params: { skip, limit } })),
  getWorkOrder: (id: number) => wrap<WorkOrder>(() => http.get(`/work-orders/${id}`)),
  createWorkOrder: (data: any) => wrap<WorkOrder>(() => http.post("/work-orders", data)),
  updateWorkOrder: (id: number, data: any) => wrap<WorkOrder>(() => http.put(`/work-orders/${id}`, data)),
  deleteWorkOrder: (id: number) => http.delete(`/work-orders/${id}`),

  // Materials - categories
  getCategories: () => wrap<MaterialCategory[]>(() => http.get("/materials/categories")),
  createCategory: (data: { name: string }) => wrap<MaterialCategory>(() => http.post("/materials/categories", data)),
  deleteCategory: (id: number) => http.delete(`/materials/categories/${id}`),

  // Materials - options
  getColors: () => wrap<MaterialColor[]>(() => http.get("/materials/colors")),
  createColor: (data: { name: string }) => wrap<MaterialColor>(() => http.post("/materials/colors", data)),
  deleteColor: (id: number) => http.delete(`/materials/colors/${id}`),
  getThicknesses: () => wrap<MaterialThickness[]>(() => http.get("/materials/thicknesses")),
  createThickness: (data: { name: string }) => wrap<MaterialThickness>(() => http.post("/materials/thicknesses", data)),
  deleteThickness: (id: number) => http.delete(`/materials/thicknesses/${id}`),

  // Materials
  getMaterials: (skip = 0, limit = 100) => wrap<Material[]>(() => http.get("/materials", { params: { skip, limit } })),
  getMaterial: (id: number) => wrap<Material>(() => http.get(`/materials/${id}`)),
  createMaterial: (data: any) => wrap<Material>(() => http.post("/materials", data)),
  updateMaterial: (id: number, data: any) => wrap<Material>(() => http.put(`/materials/${id}`, data)),
  deleteMaterial: (id: number) => http.delete(`/materials/${id}`),

  // Pool Stock
  getPoolStock: (skip = 0, limit = 100) => wrap<PoolStock[]>(() => http.get("/pool-stock", { params: { skip, limit } })),
  getPoolStockById: (id: number) => wrap<PoolStock>(() => http.get(`/pool-stock/${id}`)),
  searchPoolStock: (q: string) => wrap<PoolStock[]>(() => http.get("/pool-stock/search", { params: { q } })),
  createPoolStock: (data: any) => wrap<PoolStock>(() => http.post("/pool-stock", data)),
  updatePoolStock: (id: number, data: any) => wrap<PoolStock>(() => http.put(`/pool-stock/${id}`, data)),
  deletePoolStock: (id: number) => http.delete(`/pool-stock/${id}`),
  addStockMovement: (poolId: number, data: Partial<any>) => wrap<any>(() => http.post(`/pool-stock/${poolId}/movements`, data)),

  // App Options
  getOptions: (category?: string) => wrap<AppOption[]>(() => http.get("/options", { params: category ? { category } : {} })),
  createOption: (data: { category: string; value: string }) => wrap<AppOption>(() => http.post("/options", data)),
  deleteOption: (id: number) => http.delete(`/options/${id}`),

  // Settings
  getSettings: () => wrap<SettingsData>(() => http.get("/settings")),
  updateSettings: (data: SettingsData) => wrap<SettingsData>(() => http.put("/settings", data)),

  // PDF / Email
  downloadBudgetPdf: (id: number) => http.get(`/budgets/${id}/pdf`, { responseType: "blob" }).then((r) => r.data),
  sendBudgetEmail: (id: number) => wrap<{ message: string }>(() => http.post(`/budgets/${id}/send-email`)),

  // Reports
  getDashboard: () => wrap<DashboardStats>(() => http.get("/reports/dashboard")),
  getBudgetsByStatus: (status: string) => wrap<Budget[]>(() => http.get("/reports/budgets-by-status", { params: { status } })),
  getWorkOrdersByStatus: (status: string) => wrap<WorkOrder[]>(() => http.get("/reports/work-orders-by-status", { params: { status } })),
  getMonthlySales: (year?: number) => wrap<number[]>(() => http.get("/reports/monthly-sales", { params: year ? { year } : {} })),
};
