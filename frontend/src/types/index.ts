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
  sector: string | null;
  description: string;
  unit_length: string;
  unit_width: string;
  length: number;
  width: number;
  m2: number;
  quantity: number;
  price_m2: number;
  unit_price: number;
  total: number;
}

export interface BudgetAdicional {
  id: number;
  budget_id: number;
  concept: string | null;
  detail: string | null;
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
  material_price_m2: number;
  material_price_m2_usd: number;
  materials_data: string | null;
  color: string | null;
  thickness: string | null;
  front: string | null;
  finish: string | null;
  bacha: string | null;
  anafe: string | null;
  perforations: string | null;
  currency: string;
  usd_rate: number;
  subtotal_materials: number;
  subtotal_services: number;
  subtotal: number;
  transport: number;
  installation: number;
  discount: number;
  total: number;
  subtotal_usd: number;
  transport_usd: number;
  total_usd: number;
  deposit_received: number;
  deposit_currency: string;
  deposit_usd: number;
  balance_due: number;
  balance_due_usd: number;
  balance_paid: boolean;
  balance_paid_at: string | null;
  payment_method: string | null;
  installments: number;
  validity_days: number;
  estimated_delivery: string | null;
  estimated_date: string | null;
  priority: string;
  date: string | null;
  delivery_date: string | null;
  digital_signature: string | null;
  signed_at: string | null;
  approval_date: string | null;
  design_observations: string | null;
  important_observations: string | null;
  notes: string | null;
  fabrication_details: string | null;
  pool_id: number | null;
  pool_price: number;
  pool_currency: string;
  pool_image: string | null;
  stock_deducted: boolean;
  pools_data: string | null;
  snapshot_name: string | null;
  snapshot_phone: string | null;
  snapshot_email: string | null;
  snapshot_address: string | null;
  created_at: string;
  updated_at: string;
  items: BudgetItem[];
  adicionales: BudgetAdicional[];
  sketch_elements: BudgetSketchElement[];
}

export interface WorkOrder {
  id: number;
  number: string;
  client_id: number;
  budget_id: number | null;
  status: "budgeted" | "in_production" | "finished";
  origin: string;
  material: string | null;
  material_price_m2: number;
  materials_data: string | null;
  color: string | null;
  thickness: string | null;
  finish: string | null;
  bacha: string | null;
  anafe: string | null;
  currency: string;
  usd_rate: number;
  subtotal: number;
  transport: number;
  installation: number;
  discount: number;
  total: number;
  subtotal_usd: number;
  transport_usd: number;
  total_usd: number;
  deposit_received: number;
  deposit_currency: string;
  deposit_usd: number;
  balance_due: number;
  balance_due_usd: number;
  balance_paid: boolean;
  balance_paid_at: string | null;
  payment_method: string | null;
  installments: number;
  priority: string;
  delivery_date: string | null;
  digital_signature: string | null;
  signed_at: string | null;
  fabrication_details: string | null;
  budgeted_details: string | null;
  pool_id: number | null;
  pool_price: number;
  pool_currency: string;
  pool_image: string | null;
  stock_deducted: boolean;
  pools_data: string | null;
  adicionales_data: string | null;
  design_observations: string | null;
  important_observations: string | null;
  notes: string | null;
  snapshot_name: string | null;
  snapshot_phone: string | null;
  snapshot_email: string | null;
  snapshot_address: string | null;
  date: string | null;
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
  price_usd: number;
  currency: string;
  supplier: string | null;
  stock_available: number;
  notes: string | null;
  created_at: string;
}

export interface MaterialCategory {
  id: number;
  name: string;
}

export interface PriceHistory {
  id: number;
  material_id: number;
  material_name: string | null;
  price_m2: number;
  date: string;
  created_at: string;
}

export interface PoolStock {
  id: number;
  brand: string;
  model: string;
  description: string | null;
  material: string | null;
  quantity: number;
  price: number;
  price_usd: number;
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
  company_logo: string;
  pdf_footer: string;
  budget_terms: string;
  delivery_terms: string;
  warranty_text: string;
}

export interface DashboardStats {
  pending_budgets: number;
  approved_budgets: number;
  rejected_budgets: number;
  budgeted_orders: number;
  in_production_orders: number;
  finished_orders: number;
  pool_stock_total: number;
  total_clients: number;
  online_budgets: number;
  recent_budgets: Budget[];
  recent_orders: WorkOrder[];
}

export interface Measurement {
  id: number;
  client_name: string | null;
  client_phone: string | null;
  client_address: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  notes: string | null;
  sketch_data: string | null;
  photos_data: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OnlineBudget {
  id: number;
  number: string;
  client_name: string | null;
  work_type: string | null;
  date: string | null;
  status: string;
  usd_rate: number;
  items_data: string | null;
  total_net_ars: number;
  total_net_usd: number;
  total_consolidated: number;
  pool_id: number | null;
  pool_price: number;
  created_at: string;
  updated_at: string;
}

export interface SearchResults {
  clients: Client[];
  budgets: Budget[];
  work_orders: WorkOrder[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
