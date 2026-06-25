// Currencies
export const CURRENCIES = {
  ARS: "ARS",
  USD: "USD",
} as const;

// Cash movement types
export const MOVEMENT_TYPES = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
} as const;

// Measurement statuses
export const MEASUREMENT_STATUSES = {
  PENDIENTE: "PENDIENTE",
  REALIZADO: "REALIZADO",
  CANCELADO: "CANCELADO",
} as const;

// Status colors for badges
export const STATUS_COLORS: Record<string, string> = {
  PENDIENTE: "#f59e0b",
  ONLINE: "#3b82f6",
  APROBADO: "#22c55e",
  RECHAZADO: "#ef4444",
  "CONVERTIDO A OT": "#8b5cf6",
  MEDICION: "#f59e0b",
  TALLER: "#3b82f6",
  TERMINADA: "#22c55e",
  ENTREGADA: "#06b6d4",
  CANCELADO: "#ef4444",
} as const;

// Priority colors
export const PRIORITY_COLORS: Record<string, string> = {
  Baja: "#22c55e",
  Normal: "#3b82f6",
  Alta: "#f59e0b",
  Urgente: "#ef4444",
} as const;
