import http from "../http";
import { wrap } from "../wrap";
import type { Material, MaterialCategory, MaterialColor, MaterialThickness, PriceHistory } from "../../types";

export const materialsApi = {
  list: (skip = 0, limit = 100, category_id?: number) =>
    wrap<Material[]>(() => http.get("/materials", { params: { skip, limit, category_id } })),
  get: (id: number) => wrap<Material>(() => http.get(`/materials/${id}`)),
  create: (data: any) => wrap<Material>(() => http.post("/materials", data)),
  update: (id: number, data: any) => wrap<Material>(() => http.put(`/materials/${id}`, data)),
  delete: (id: number) => http.delete(`/materials/${id}`),
  priceHistory: (materialId: number) => wrap<PriceHistory[]>(() => http.get(`/materials/${materialId}/price-history`)),
  categories: {
    list: () => wrap<MaterialCategory[]>(() => http.get("/materials/categories")),
    create: (data: { name: string }) => wrap<MaterialCategory>(() => http.post("/materials/categories", data)),
    delete: (id: number) => http.delete(`/materials/categories/${id}`),
  },
  colors: {
    list: () => wrap<MaterialColor[]>(() => http.get("/materials/colors")),
    create: (data: { name: string }) => wrap<MaterialColor>(() => http.post("/materials/colors", data)),
    delete: (id: number) => http.delete(`/materials/colors/${id}`),
  },
  thicknesses: {
    list: () => wrap<MaterialThickness[]>(() => http.get("/materials/thicknesses")),
    create: (data: { name: string }) => wrap<MaterialThickness>(() => http.post("/materials/thicknesses", data)),
    delete: (id: number) => http.delete(`/materials/thicknesses/${id}`),
  },
};
