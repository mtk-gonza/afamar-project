import http from "../http";
import { wrap } from "../wrap";
import type { Client } from "../../types";

export const clientsApi = {
  list: (skip = 0, limit = 100) => wrap<Client[]>(() => http.get("/clients", { params: { skip, limit } })),
  get: (id: number) => wrap<Client>(() => http.get(`/clients/${id}`)),
  search: (q: string) => wrap<Client[]>(() => http.get("/clients/search", { params: { q } })),
  create: (data: any) => wrap<Client>(() => http.post("/clients", data)),
  update: (id: number, data: any) => wrap<Client>(() => http.put(`/clients/${id}`, data)),
  delete: (id: number) => http.delete(`/clients/${id}`),
};
