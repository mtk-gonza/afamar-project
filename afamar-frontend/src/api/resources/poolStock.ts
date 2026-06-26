import http from "@/api/http";
import { wrap } from "@/api/wrap";
import type { CreatePoolStockInput, PoolStock } from "@/types";

export const poolStockApi = {
  list: (skip = 0, limit = 100) => wrap<PoolStock[]>(() => http.get("/pool-stock", { params: { skip, limit } })),
  get: (id: number) => wrap<PoolStock>(() => http.get(`/pool-stock/${id}`)),
  search: (q: string) => wrap<PoolStock[]>(() => http.get("/pool-stock/search", { params: { q } })),
  create: (data: CreatePoolStockInput) => wrap<PoolStock>(() => http.post("/pool-stock", data)),
  update: (id: number, data: Partial<CreatePoolStockInput>) => wrap<PoolStock>(() => http.put(`/pool-stock/${id}`, data)),
  delete: (id: number) => http.delete(`/pool-stock/${id}`),
  addMovement: (poolId: number, data: Partial<any>) => wrap<any>(() => http.post(`/pool-stock/${poolId}/movements`, data)),
};
