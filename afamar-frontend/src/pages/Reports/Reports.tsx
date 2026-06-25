import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ChartBar } from "../../components/ui/ChartBar";
import { PieChart } from "../../components/ui/PieChart";
import type { WorkOrder } from "../../types";
import styles from "./Reports.module.css";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const PIE_COLORS: Record<string, string> = {
  pending: "#3b82f6",
  approved: "#22c55e",
  rejected: "#ef4444",
  budgeted: "#f59e0b",
  in_production: "#8b5cf6",
  finished: "#06b6d4",
  delivered: "#6366f1",
};

const BUDGET_STATUS_LABELS: Record<string, string> = {
  pending: "Pendientes",
  approved: "Aprobados",
  rejected: "Rechazados",
};

const WORK_STATUS_LABELS: Record<string, string> = {
  budgeted: "Presupuestadas",
  in_production: "En producción",
  finished: "Terminadas",
  delivered: "Entregadas",
};

export function Reports() {
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [budgetsByStatus, setBudgetsByStatus] = useState<any[]>([]);
  const [ordersInProduction, setOrdersInProduction] = useState<WorkOrder[]>([]);
  const [monthlySales, setMonthlySales] = useState<{ month: string; total: number; total_usd: number }[]>([]);
  const [mostUsed, setMostUsed] = useState<{ name: string; usage_count: number }[]>([]);
  const [budgetPie, setBudgetPie] = useState<{ status: string; count: number }[]>([]);
  const [workOrderPie, setWorkOrderPie] = useState<{ status: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.allSettled([
      api.getBudgetsByStatus(selectedStatus, dateFrom || undefined, dateTo || undefined).then(setBudgetsByStatus),
      api.getWorkOrdersByStatus("in_production", dateFrom || undefined, dateTo || undefined).then(setOrdersInProduction as any),
      api.getMonthlySales(undefined, dateFrom || undefined, dateTo || undefined).then(setMonthlySales),
      api.getMostUsedMaterials().then(setMostUsed),
    ]);
    const [budgetCounts, workCounts] = await Promise.all([
      Promise.all(
        ["pending", "approved", "rejected"].map((s) =>
          api.getBudgetsByStatus(s, dateFrom || undefined, dateTo || undefined).then((r) => ({ status: s, count: r.length }))
        )
      ),
      Promise.all(
        ["budgeted", "in_production", "finished", "delivered"].map((s) =>
          api.getWorkOrdersByStatus(s, dateFrom || undefined, dateTo || undefined).then((r) => ({ status: s, count: r.length }))
        )
      ),
    ]);
    setBudgetPie(budgetCounts);
    setWorkOrderPie(workCounts);
    setLoading(false);
  }, [selectedStatus, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const maxSale = Math.max(...monthlySales.map((s) => s.total), 1);

  const salesChart = monthlySales.map((s) => ({
    label: MONTHS[Number(s.month) - 1] || s.month,
    value: s.total,
    color: "#1a1a2e",
  }));

  const budgetPieData = budgetPie
    .filter((d) => d.count > 0)
    .map((d) => ({ label: BUDGET_STATUS_LABELS[d.status] || d.status, value: d.count, color: PIE_COLORS[d.status] || "#999" }));

  const workOrderPieData = workOrderPie
    .filter((d) => d.count > 0)
    .map((d) => ({ label: WORK_STATUS_LABELS[d.status] || d.status, value: d.count, color: PIE_COLORS[d.status] || "#999" }));

  return (
    <div className={styles.reports}>
      <h2 className={styles.reports__title}>Reportes</h2>

      <div className={styles.reports__filters}>
        <label className={styles.reports__filterLabel}>
          Desde
          <input className={styles.reports__filterInput} type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label className={styles.reports__filterLabel}>
          Hasta
          <input className={styles.reports__filterInput} type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        {(dateFrom || dateTo) && (
          <button className={styles.reports__filterClear} onClick={() => { setDateFrom(""); setDateTo(""); }}>Limpiar</button>
        )}
      </div>

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

          <div className={styles.reports__grid}>
            <section className={styles.reports__section}>
              <h3 className={styles.reports__sectionTitle}>Presupuestos por estado</h3>
              <PieChart data={budgetPieData} />
            </section>

            <section className={styles.reports__section}>
              <h3 className={styles.reports__sectionTitle}>Órdenes por estado</h3>
              <PieChart data={workOrderPieData} />
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
