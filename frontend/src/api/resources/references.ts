import http from "../http";
import { wrap } from "../wrap";

const RESOURCES = [
  "budget-statuses",
  "work-order-statuses",
  "payment-methods",
  "priority-levels",
  "finish-types",
] as const;

type Resource = (typeof RESOURCES)[number];

function createApi(resource: Resource) {
  return {
    list: (isActive?: boolean) =>
      wrap<any[]>(() =>
        http.get(`/references/${resource}`, {
          params: isActive !== undefined ? { is_active: isActive } : {},
        }),
      ),
    get: (id: number) => wrap<any>(() => http.get(`/references/${resource}/${id}`)),
    create: (data: { name: string; label: string; color?: string; sort_order?: number }) =>
      wrap<any>(() => http.post(`/references/${resource}`, data)),
    update: (id: number, data: Record<string, any>) =>
      wrap<any>(() => http.put(`/references/${resource}/${id}`, data)),
    delete: (id: number) => http.delete(`/references/${resource}/${id}`),
  };
}

export const referencesApi = {
  budgetStatuses: createApi("budget-statuses"),
  workOrderStatuses: createApi("work-order-statuses"),
  paymentMethods: createApi("payment-methods"),
  priorityLevels: createApi("priority-levels"),
  finishTypes: createApi("finish-types"),
};
