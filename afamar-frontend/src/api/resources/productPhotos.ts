import http from "@/api/http";
import { wrap } from "@/api/wrap";
import type { CreateProductPhotoData, ProductPhoto } from "@/types";

export const productPhotosApi = {
  list: (skip = 0, limit = 100) => wrap<ProductPhoto[]>(() => http.get("/product-photos", { params: { skip, limit } })),
  latest: (limit = 12) => wrap<ProductPhoto[]>(() => http.get("/product-photos/latest", { params: { limit } })),
  get: (id: number) => wrap<ProductPhoto>(() => http.get(`/product-photos/${id}`)),
  create: (formData: FormData) =>
    wrap<ProductPhoto>(() =>
      http.post("/product-photos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    ),
  update: (id: number, data: CreateProductPhotoData) => wrap<ProductPhoto>(() => http.put(`/product-photos/${id}`, data)),
  delete: (id: number) => http.delete(`/product-photos/${id}`),
};
