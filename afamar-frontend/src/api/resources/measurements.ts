import http from "@/api/http";
import { wrap } from "@/api/wrap";
import type { CreateMeasurementInput, Measurement } from "@/types";

export const measurementsApi = {
  list: (skip = 0, limit = 100) => wrap<Measurement[]>(() => http.get("/measurements", { params: { skip, limit } })),
  get: (id: number) => wrap<Measurement>(() => http.get(`/measurements/${id}`)),
  create: (data: CreateMeasurementInput) => wrap<Measurement>(() => http.post("/measurements", data)),
  update: (id: number, data: Partial<CreateMeasurementInput> & { status?: string }) => wrap<Measurement>(() => http.put(`/measurements/${id}`, data)),
  delete: (id: number) => http.delete(`/measurements/${id}`),
};
