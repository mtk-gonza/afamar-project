import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorBlock } from "../../components/ui/ErrorBlock";
import { ChartBar } from "../../components/ui/ChartBar";
import type { DashboardStats } from "../../types";
import styles from "./Dashboard.module.css";

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await api.getDashboard());
    } catch {
      setError("Error al cargar dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className={styles.dashboard}><LoadingSpinner /></div>;
  if (error) return <div className={styles.dashboard}><ErrorBlock message={error} onRetry={load} /></div>;
  if (!stats) return null;

  const statusChart = [
    { label: "Pendientes", value: stats.pending_budgets, color: "#f59e0b" },
    { label: "Aprobados", value: stats.approved_budgets, color: "#10b981" },
    { label: "Rechazados", value: stats.rejected_budgets, color: "#ef4444" },
  ];
  const maxStatus = Math.max(...statusChart.map((s) => s.value), 1);

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboard__brand}>
        <h2 className={styles.dashboard__title}>AFAMAR</h2>
        <p className={styles.dashboard__subtitle}>Sistema de gestión de presupuestos y órdenes de trabajo</p>
      </div>

      <div className={styles.dashboard__cards}>
        <div className={styles.dashboard__card}>
          <span className={styles.dashboard__cardValue}>{stats.pending_budgets}</span>
          <span className={styles.dashboard__cardLabel}>Presupuestos Pendientes</span>
        </div>
        <div className={styles.dashboard__card}>
          <span className={styles.dashboard__cardValue}>{stats.approved_budgets}</span>
          <span className={styles.dashboard__cardLabel}>Aprobados</span>
        </div>
        <div className={styles.dashboard__card}>
          <span className={styles.dashboard__cardValue}>{stats.workshop_orders}</span>
          <span className={styles.dashboard__cardLabel}>En Taller</span>
        </div>
        <div className={styles.dashboard__card}>
          <span className={styles.dashboard__cardValue}>{stats.delivered_orders}</span>
          <span className={styles.dashboard__cardLabel}>Entregadas</span>
        </div>
        <div className={styles.dashboard__card}>
          <span className={styles.dashboard__cardValue}>{stats.finished_orders}</span>
          <span className={styles.dashboard__cardLabel}>Finalizadas</span>
        </div>
        <div className={styles.dashboard__card}>
          <span className={styles.dashboard__cardValue}>{stats.pool_stock_total}</span>
          <span className={styles.dashboard__cardLabel}>Piletas en Stock</span>
        </div>
        <div className={styles.dashboard__card}>
          <span className={styles.dashboard__cardValue}>{stats.total_clients}</span>
          <span className={styles.dashboard__cardLabel}>Clientes</span>
        </div>
        <div className={styles.dashboard__card}>
          <span className={styles.dashboard__cardValue}>{stats.online_budgets}</span>
          <span className={styles.dashboard__cardLabel}>Online</span>
        </div>
      </div>

      <div className={styles.dashboard__charts}>
        <div className={styles.dashboard__chart}>
          <h3 className={styles.dashboard__chartTitle}>Presupuestos por estado</h3>
          <ChartBar items={statusChart} maxValue={maxStatus} horizontal />
        </div>
      </div>

      <div className={styles.dashboard__recentGrid}>
        <div className={styles.dashboard__recent}>
          <h3 className={styles.dashboard__chartTitle}>Últimos presupuestos</h3>
          {stats.recent_budgets.length === 0 && <p className={styles.dashboard__recentEmpty}>Sin presupuestos recientes</p>}
          {stats.recent_budgets.map((b) => (
            <div key={b.id} className={styles.dashboard__recentItem} onClick={() => navigate(`/admin/budgets/${b.id}/edit`)}>
              <strong>{b.number}</strong>
              <span>$ {b.total.toFixed(2)}</span>
              <span className={styles.dashboard__recentDate}>{new Date(b.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
        <div className={styles.dashboard__recent}>
          <h3 className={styles.dashboard__chartTitle}>Últimas órdenes</h3>
          {stats.recent_orders.length === 0 && <p className={styles.dashboard__recentEmpty}>Sin órdenes recientes</p>}
          {stats.recent_orders.map((o) => (
            <div key={o.id} className={styles.dashboard__recentItem} onClick={() => navigate(`/admin/work-orders/${o.id}/edit`)}>
              <strong>{o.number}</strong>
              <span>$ {o.total.toFixed(2)}</span>
              <span className={styles.dashboard__recentDate}>{new Date(o.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.dashboard__actions}>
        <Link to="/admin/budgets/new" className={styles.dashboard__actionBtn}>Nuevo Presupuesto</Link>
        <Link to="/admin/work-orders/new" className={styles.dashboard__actionBtn}>Nueva Orden</Link>
        <Link to="/admin/clients/new" className={styles.dashboard__actionBtn}>Nuevo Cliente</Link>
        <Link to="/admin/measurements/new" className={styles.dashboard__actionBtn}>Nueva Medición</Link>
      </div>
    </div>
  );
}
