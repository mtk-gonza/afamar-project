import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import type { WorkOrder } from "../../types";
import styles from "./WorkOrders.module.css";

const statusLabel: Record<string, string> = { budgeted: "Presupuestado", in_production: "En Producción", finished: "Finalizado" };

export function WorkOrders() {
  const navigate = useNavigate();
  const [items, setItems] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "kanban">("table");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await api.getWorkOrders());
    } catch {
      setError("Error al cargar órdenes de trabajo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number, num: string) => {
    if (!confirm(`¿Eliminar orden ${num}?`)) return;
    await api.deleteWorkOrder(id);
    load();
  };

  const columns = [
    { key: "budgeted", label: "Presupuestado" },
    { key: "in_production", label: "En Producción" },
    { key: "finished", label: "Finalizado" },
  ];

  return (
    <div className={styles.workOrders}>
      <div className={styles.workOrders__header}>
        <h2 className={styles.workOrders__title}>Órdenes de Trabajo</h2>
        <div className={styles.workOrders__toolbar}>
          <div className={styles.workOrders__tabs}>
            <button
              type="button"
              className={`${styles.workOrders__tab} ${view === "table" ? styles["workOrders__tab--active"] : ""}`}
              onClick={() => setView("table")}
            >
              Tabla
            </button>
            <button
              type="button"
              className={`${styles.workOrders__tab} ${view === "kanban" ? styles["workOrders__tab--active"] : ""}`}
              onClick={() => setView("kanban")}
            >
              Kanban
            </button>
          </div>
          <Link to="/work-orders/new" className={styles.workOrders__addBtn}>+ Nueva</Link>
        </div>
      </div>

      {loading && <div className={styles.workOrders__state}>Cargando...</div>}
      {error && (
        <div className={styles.workOrders__state}>
          <p>{error}</p>
          <button className={styles.workOrders__addBtn} onClick={load}>Reintentar</button>
        </div>
      )}

      {!loading && !error && view === "table" && items.length === 0 && (
        <div className={styles.workOrders__state}>No hay órdenes de trabajo aún.</div>
      )}

      {!loading && !error && view === "table" && items.length > 0 && (
        <table className={styles.workOrders__table}>
          <thead>
            <tr><th>Número</th><th>Cliente</th><th>Estado</th><th>Prioridad</th><th>Fecha</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {items.map((o) => (
              <tr key={o.id}>
                <td>{o.number}</td>
                <td>{o.client_id}</td>
                <td>{statusLabel[o.status] || o.status}</td>
                <td>{o.priority === "urgent" ? "Urgente" : "Normal"}</td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td className={styles.workOrders__actions}>
                  <button className={styles.workOrders__actionBtn} onClick={() => navigate(`/work-orders/${o.id}/edit`)}>Editar</button>
                  <button className={`${styles.workOrders__actionBtn} ${styles["workOrders__actionBtn--danger"]}`} onClick={() => handleDelete(o.id, o.number)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && !error && view === "kanban" && (
        <div className={styles.workOrders__kanban}>
          {columns.map((col) => (
            <div key={col.key} className={styles.workOrders__column}>
              <h3 className={styles.workOrders__columnTitle}>{col.label}</h3>
              {items
                .filter((o) => o.status === col.key)
                .map((o) => (
                  <div
                    key={o.id}
                    className={`${styles.workOrders__card} ${o.priority === "urgent" ? styles["workOrders__card--urgent"] : ""}`}
                    onClick={() => navigate(`/work-orders/${o.id}/edit`)}
                  >
                    <strong>{o.number}</strong>
                    <span>Cliente: {o.client_id}</span>
                    <span>{o.delivery_date ? `Entrega: ${new Date(o.delivery_date).toLocaleDateString()}` : "Sin fecha"}</span>
                    {o.priority === "urgent" && <span className={styles.workOrders__urgentBadge}>Urgente</span>}
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
