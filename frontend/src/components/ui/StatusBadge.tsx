import styles from "./StatusBadge.module.css";

interface StatusBadgeProps {
  status: string;
  labels?: Record<string, string>;
}

const defaultLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  budgeted: "Presupuestado",
  in_production: "En Producción",
  finished: "Finalizado",
  PENDIENTE: "Pendiente",
  REALIZADO: "Realizado",
  CANCELADO: "Cancelado",
};

export function StatusBadge({ status, labels }: StatusBadgeProps) {
  const label = (labels || defaultLabels)[status] || status;
  return <span className={`${styles.badge} ${styles[`badge--${status}`] || ""}`}>{label}</span>;
}
