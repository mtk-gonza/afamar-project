import http from "../http";
import { wrap } from "../wrap";

export const whatsappApi = {
  sendBudget: (id: number, phone?: string) =>
    wrap<any>(() => http.post(`/whatsapp/send-budget/${id}`, { phone })),
};
