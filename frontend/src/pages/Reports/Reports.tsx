import { useEffect, useState } from "react";
import { api } from "../../api/client";
import styles from "./Reports.module.css";

export function Reports() {
  const [budgetsByStatus, setBudgetsByStatus] = useState<any[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<any[]>([]);
  const [monthlySales, setMonthlySales] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("pending");

  useEffect(() => {
    api.getBudgetsByStatus(selectedStatus).then(setBudgetsByStatus);
    api.getWorkOrdersByStatus("in_production").then(setOrdersByStatus);
    api.getMonthlySales().then(setMonthlySales);
  }, [selectedStatus]);

  return (
    <div className={styles.reports}>
      <h2 className={styles.reports__title}>Reportes</h2>

      <section className={styles.reports__section}>
        <h3 className={styles.reports__sectionTitle}>Presupuestos por estado</h3>
        <select className={styles.reports__select} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobados</option>
          <option value="rejected">Rechazados</option>
        </select>
        <table className={styles.reports__table}>
          <thead><tr><th>Número</th><th>Total</th><th>Fecha</th></tr></thead>
          <tbody>
            {budgetsByStatus.map((b: any) => (
              <tr key={b.id}><td>{b.number}</td><td>$ {b.total.toFixed(2)}</td><td>{new Date(b.created_at).toLocaleDateString()}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.reports__section}>
        <h3 className={styles.reports__sectionTitle}>Órdenes en producción</h3>
        <table className={styles.reports__table}>
          <thead><tr><th>Número</th><th>Estado</th></tr></thead>
          <tbody>
            {ordersByStatus.map((o: any) => (
              <tr key={o.id}><td>{o.number}</td><td>{o.status}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.reports__section}>
        <h3 className={styles.reports__sectionTitle}>Ventas mensuales</h3>
        <table className={styles.reports__table}>
          <thead><tr><th>Mes</th><th>Total</th></tr></thead>
          <tbody>
            {monthlySales.map((s: any) => (
              <tr key={s.month}><td>{s.month}</td><td>$ {s.total.toFixed(2)}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
