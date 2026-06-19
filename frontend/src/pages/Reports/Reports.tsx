import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ChartBar } from "../../components/ui/ChartBar";
import type { WorkOrder } from "../../types";
import styles from "./Reports.module.css";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function Reports() {
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [budgetsByStatus, setBudgetsByStatus] = useState<any[]>([]);
  const [ordersInProduction, setOrdersInProduction] = useState<WorkOrder[]>([]);
  const [monthlySales, setMonthlySales] = useState<{ month: string; total: number; total_usd: number }[]>([]);
  const [mostUsed, setMostUsed] = useState<{ name: string; usage_count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.allSettled([
      api.getBudgetsByStatus(selectedStatus).then(setBudgetsByStatus),
      api.getWorkOrdersByStatus("in_production").then(setOrdersInProduction as any),
      api.getMonthlySales().then(setMonthlySales),
      api.getMostUsedMaterials().then(setMostUsed),
    ]);
    setLoading(false);
  }, [selectedStatus]);

  useEffect(() => { load(); }, [load]);

  const maxSale = Math.max(...monthlySales.map((s) => s.total), 1);

  const salesChart = monthlySales.map((s) => ({
    label: MONTHS[Number(s.month) - 1] || s.month,
    value: s.total,
    color: "#1a1a2e",
  }));

  return (
    <div className={styles.reports}>
      <h2 className={styles.reports__title}>Reportes</h2>

      {loading && <LoadingSpinner />}

      {!loading && (
        <>
          <div className={styles.reports__grid}>
            <section className={styles.reports__section}>
              <h3 className={styles.reports__sectionTitle}>Ventas mensuales</h3>
              {monthlySales.length === 0 ? (
                <p className={styles.reports__empty}>Sin datos de ventas</p>
              ) : (
                <ChartBar items={salesChart} maxValue={maxSale} />
              )}
            </section>

            <section className={styles.reports__section}>
              <h3 className={styles.reports__sectionTitle}>Materiales más usados</h3>
              {mostUsed.length === 0 ? (
                <p className={styles.reports__empty}>Sin datos de materiales</p>
              ) : (
                <table className={styles.reports__table}>
                  <thead><tr><th>Material</th><th>Usos</th></tr></thead>
                  <tbody>
                    {mostUsed.map((m) => (
                      <tr key={m.name}><td>{m.name}</td><td>{m.usage_count}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>

          <section className={styles.reports__section}>
            <h3 className={styles.reports__sectionTitle}>Presupuestos por estado</h3>
            <select className={styles.reports__select} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobados</option>
              <option value="rejected">Rechazados</option>
            </select>
            <table className={styles.reports__table}>
              <thead><tr><th>Número</th><th>Total ARS</th><th>Total USD</th><th>Fecha</th></tr></thead>
              <tbody>
                {budgetsByStatus.length === 0 && (
                  <tr><td colSpan={4} className={styles.reports__empty}>Sin resultados</td></tr>
                )}
                {budgetsByStatus.map((b: any) => (
                  <tr key={b.id}>
                    <td>{b.number}</td>
                    <td>$ {b.total.toFixed(2)}</td>
                    <td>{b.total_usd > 0 ? `US$ ${b.total_usd.toFixed(2)}` : "-"}</td>
                    <td>{new Date(b.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className={styles.reports__section}>
            <h3 className={styles.reports__sectionTitle}>Órdenes en producción</h3>
            {ordersInProduction.length === 0 ? (
              <p className={styles.reports__empty}>Sin órdenes en producción</p>
            ) : (
              <table className={styles.reports__table}>
                <thead><tr><th>Número</th><th>Total</th><th>Prioridad</th></tr></thead>
                <tbody>
                  {ordersInProduction.map((o) => (
                    <tr key={o.id}>
                      <td>{o.number}</td>
                      <td>$ {o.total.toFixed(2)}</td>
                      <td>{o.priority === "urgent" ? "Urgente" : "Normal"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
