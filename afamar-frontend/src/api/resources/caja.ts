import http from "../http";
import { wrap } from "../wrap";

export interface CashMovement {
  id: number;
  daily_cash_id: number;
  type: string;
  amount: number;
  description: string;
  payment_method: string | null;
  folder_status: string | null;
  order_id: number | null;
  order_number: string | null;
  order_total: number | null;
  client_name: string | null;
  expense_type: string | null;
  remaining_balance: number | null;
  created_at: string;
}

export interface DailyCash {
  id: number;
  date: string;
  previous_balance: number;
  total_income: number;
  total_expenses: number;
  total_sum: number;
  current_balance: number;
  real_cash: number;
  is_closed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  movements: CashMovement[];
}

export const cashApi = {
  getDaily: (date: string) => wrap<DailyCash>(() => http.get("/cash/daily", { params: { query_date: date } })),
  createMovement: (data: any) => wrap<DailyCash>(() => http.post("/cash/movements", data)),
  deleteMovement: (id: number) => wrap<DailyCash>(() => http.delete(`/cash/movements/${id}`)),
  updatePreviousBalance: (date: string, previousBalance: number) =>
    wrap<DailyCash>(() => http.put("/cash/previous-balance", { date, previous_balance: previousBalance })),
  closeDailyCash: (date: string, notes?: string) =>
    wrap<DailyCash>(() => http.post("/cash/daily/close", { date, notes })),
  getHistory: () => wrap<DailyCash[]>(() => http.get("/cash/history")),
};
