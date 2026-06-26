import http from "@/api/http";
import { wrap } from "@/api/wrap";

export const whatsappApi = {
  sendBudget: (id: number, phone?: string) =>
    wrap<any>(() => http.post(`/whatsapp/send-budget/${id}`, { phone })),
  sendWorkOrder: (id: number, phone?: string) =>
    wrap<any>(() => http.post(`/whatsapp/send-work-order/${id}`, { phone })),
};
