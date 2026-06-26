import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useNotify } from "../../context/NotificationContext";
import { useConfirm } from "../../components/ui/useConfirm";
import { PageHeader } from "../../components/ui/PageHeader";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorBlock } from "../../components/ui/ErrorBlock";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { TableActions } from "../../components/ui/TableActions";
import type { WorkOrder } from "../../types";
import styles from "./WorkOrders.module.css";

export function WorkOrders() {
  const navigate = useNavigate();
  const notify = useNotify();
  const { confirm, dialog } = useConfirm();
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

  const handleSendWhatsApp = async (o: WorkOrder) => {
    try {
      await api.sendWorkOrderWhatsApp(o.id);
      notify("WhatsApp enviado", "success");
    } catch (e: any) {
      notify(e.message || "Error al enviar WhatsApp", "error");
    }
  };

  const handleDelete = async (id: number, num: string) => {
    if (!(await confirm(`¿Eliminar orden ${num}?`, "Eliminar", true))) return;
    await api.deleteWorkOrder(id);
    load();
  };

  const columns = [
    { key: "MEASUREMENT", label: "Medición" },
    { key: "WORKSHOP", label: "Taller" },
    { key: "FINISHED", label: "Terminado" },
    { key: "DELIVERED", label: "Entregado" },
  ];

  return (
    <div className={styles.workOrders}>
      <PageHeader title="Órdenes de Trabajo">
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
        <Link to="/admin/work-orders/new" className={styles.workOrders__addBtn}>+ Nueva</Link>
      </PageHeader>

      {loading && <LoadingSpinner />}
      {error && <ErrorBlock message={error} onRetry={load} />}

      {!loading && !error && view === "table" && items.length === 0 && (
        <EmptyState message="No hay órdenes de trabajo aún." />
      )}

      {!loading && !error && view === "table" && items.length > 0 && (
        <table className={styles.workOrders__table}>
          <thead>
            <tr><th>Número</th><th>Cliente</th><th>Estado</th><th>Prioridad</th><th>Total ARS</th><th>Total USD</th><th>Saldo</th><th>Entrega</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {items.map((o) => (
              <tr key={o.id}>
                <td>{o.number}</td>
                <td>{o.client_id}</td>
                <td><StatusBadge status={o.status} /></td>
                <td>{o.priority === "URGENT" ? "Urgente" : "Normal"}</td>
                <td>$ {o.total.toFixed(2)}</td>
                <td>{o.total_usd > 0 ? `US$ ${o.total_usd.toFixed(2)}` : "-"}</td>
                <td>{o.balance_due > 0 ? `$ ${o.balance_due.toFixed(2)}` : "Pagado"}</td>
                <td>{o.delivery_date ? new Date(o.delivery_date).toLocaleDateString() : "-"}</td>
                <TableActions onEdit={() => navigate(`/admin/work-orders/${o.id}/edit`)} onDelete={() => handleDelete(o.id, o.number)}>
                  <button className={styles.workOrders__actionBtn} title="Enviar por WhatsApp" onClick={() => handleSendWhatsApp(o)}>WA</button>
                </TableActions>
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
                    className={`${styles.workOrders__card} ${o.priority === "URGENT" ? styles["workOrders__card--urgent"] : ""}`}
                    onClick={() => navigate(`/admin/work-orders/${o.id}/edit`)}
                  >
                    <strong>{o.number}</strong>
                    <span>Cliente: {o.client_id}</span>
                    <span>{o.material || "Sin material"}</span>
                    <span>{o.delivery_date ? `Entrega: ${new Date(o.delivery_date).toLocaleDateString()}` : "Sin fecha"}</span>
                    <span>$ {o.total.toFixed(2)}</span>
                    {o.priority === "URGENT" && <span className={styles.workOrders__urgentBadge}>Urgente</span>}
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
      {dialog}
    </div>
  );
}
