export interface Client {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  total_purchased: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetItem {
  id: number;
  budget_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface BudgetSketchElement {
  id: number;
  budget_id: number;
  type: string;
  data: string | null;
  order: number;
}

export interface Budget {
  id: number;
  number: string;
  client_id: number;
  status: "pending" | "approved" | "rejected";
  material: string | null;
  color: string | null;
  thickness: string | null;
  front: string | null;
  finish: string | null;
  bacha: string | null;
  anafe: string | null;
  perforations: string | null;
  subtotal: number;
  usd_reference: number;
  shipping: number;
  total: number;
  payment_method: string | null;
  validity_days: number;
  estimated_delivery: string | null;
  estimated_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: BudgetItem[];
  sketch_elements: BudgetSketchElement[];
}

export interface WorkOrder {
  id: number;
  number: string;
  client_id: number;
  budget_id: number | null;
  status: "budgeted" | "in_production" | "finished";
  material: string | null;
  color: string | null;
  thickness: string | null;
  bacha: string | null;
  anafe: string | null;
  deposit_received: number;
  balance_due: number;
  delivery_date: string | null;
  priority: "normal" | "urgent";
  digital_signature: string | null;
  signed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppOption {
  id: number;
  category: string;
  value: string;
  sort_order: number;
}

export interface MaterialColor {
  id: number;
  name: string;
  category_id: number | null;
}

export interface MaterialThickness {
  id: number;
  name: string;
}

export interface Material {
  id: number;
  name: string;
  category_id: number;
  color: string | null;
  available_thickness: string | null;
  base_price: number;
  notes: string | null;
  created_at: string;
}

export interface MaterialCategory {
  id: number;
  name: string;
}

export interface PoolStock {
  id: number;
  brand: string;
  model: string;
  description: string | null;
  material: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
  movements: StockMovement[];
}

export interface StockMovement {
  id: number;
  pool_id: number;
  type: "entry" | "exit";
  quantity: number;
  notes: string | null;
  created_at: string;
}

export interface SettingsData {
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  pdf_footer: string;
  budget_terms: string;
  delivery_terms: string;
  warranty_text: string;
}

export interface DashboardStats {
  pending_budgets: number;
  budgeted_orders: number;
  in_production_orders: number;
  finished_orders: number;
  pool_stock_total: number;
  total_clients: number;
}
