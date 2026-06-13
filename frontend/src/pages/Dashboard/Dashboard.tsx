import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import type { DashboardStats } from "../../types";
import styles from "./Dashboard.module.css";

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.getDashboard().then(setStats);
  }, []);

  if (!stats) return <div className={styles.dashboard}>Cargando...</div>;

  return (
    <div className={styles.dashboard}>
      <h2 className={styles.dashboard__title}>Dashboard</h2>
      <div className={styles.dashboard__cards}>
        <div className={styles.dashboard__card}>
          <span className={styles.dashboard__cardValue}>{stats.pending_budgets}</span>
          <span className={styles.dashboard__cardLabel}>Presupuestos Pendientes</span>
        </div>
        <div className={styles.dashboard__card}>
          <span className={styles.dashboard__cardValue}>{stats.budgeted_orders}</span>
          <span className={styles.dashboard__cardLabel}>Órdenes Presupuestadas</span>
        </div>
        <div className={styles.dashboard__card}>
          <span className={styles.dashboard__cardValue}>{stats.in_production_orders}</span>
          <span className={styles.dashboard__cardLabel}>En Producción</span>
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
      </div>
      <div className={styles.dashboard__actions}>
        <Link to="/budgets/new" className={styles.dashboard__actionBtn}>Nuevo Presupuesto</Link>
        <Link to="/work-orders/new" className={styles.dashboard__actionBtn}>Nueva Orden</Link>
        <Link to="/clients/new" className={styles.dashboard__actionBtn}>Nuevo Cliente</Link>
      </div>
    </div>
  );
}
