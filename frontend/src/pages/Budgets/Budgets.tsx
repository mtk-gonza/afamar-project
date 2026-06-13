import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useNotify } from "../../context/NotificationContext";
import type { Budget } from "../../types";
import styles from "./Budgets.module.css";

const statusLabel: Record<string, string> = { pending: "Pendiente", approved: "Aprobado", rejected: "Rechazado" };

export function Budgets() {
  const navigate = useNavigate();
  const notify = useNotify();
  const [items, setItems] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await api.getBudgets());
    } catch {
      setError("Error al cargar presupuestos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApproval = async (b: Budget) => {
    if (b.status === "pending") {
      await api.updateBudget(b.id, { status: "approved" });
      if (confirm("¿Convertir a Orden de Trabajo?")) {
        await api.createFromBudget(b.id);
      }
    } else if (b.status === "approved") {
      await api.updateBudget(b.id, { status: "rejected" });
    } else {
      await api.updateBudget(b.id, { status: "pending" });
    }
    load();
  };

  const handleDelete = async (id: number, num: string) => {
    if (!confirm(`¿Eliminar presupuesto ${num}?`)) return;
    await api.deleteBudget(id);
    load();
  };

  const handleDownloadPdf = async (b: Budget) => {
    try {
      const blob = await api.downloadBudgetPdf(b.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `presupuesto_${b.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      notify("Error al descargar PDF", "error");
    }
  };

  const handleSendEmail = async (b: Budget) => {
    try {
      await api.sendBudgetEmail(b.id);
      notify("Email enviado correctamente", "success");
    } catch (e: any) {
      notify(e?.response?.data?.detail || "Error al enviar email", "error");
    }
  };

  return (
    <div className={styles.budgets}>
      <div className={styles.budgets__header}>
        <h2 className={styles.budgets__title}>Presupuestos</h2>
        <Link to="/budgets/new" className={styles.budgets__addBtn}>+ Nuevo</Link>
      </div>

      {loading && <div className={styles.budgets__state}>Cargando...</div>}
      {error && (
        <div className={styles.budgets__state}>
          <p>{error}</p>
          <button className={styles.budgets__addBtn} onClick={load}>Reintentar</button>
        </div>
      )}
      {!loading && !error && items.length === 0 && <div className={styles.budgets__state}>No hay presupuestos aún.</div>}

      {!loading && !error && items.length > 0 && (
        <table className={styles.budgets__table}>
          <thead>
            <tr><th>Número</th><th>Cliente</th><th>Estado</th><th>Total</th><th>Fecha</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b.id}>
                <td>{b.number}</td>
                <td>{b.client_id}</td>
                <td>{statusLabel[b.status] || b.status}</td>
                <td>$ {b.total.toFixed(2)}</td>
                <td>{new Date(b.created_at).toLocaleDateString()}</td>
                <td className={styles.budgets__actions}>
                  <button className={styles.budgets__actionBtn} onClick={() => navigate(`/budgets/${b.id}/edit`)}>Editar</button>
                  {b.status === "pending" && <button className={styles.budgets__actionBtn} onClick={() => handleApproval(b)}>Aprobar</button>}
                  <button className={styles.budgets__actionBtn} title="Descargar PDF" onClick={() => handleDownloadPdf(b)}>PDF</button>
                  <button className={styles.budgets__actionBtn} title="Enviar por email" onClick={() => handleSendEmail(b)}>Email</button>
                  <button className={`${styles.budgets__actionBtn} ${styles["budgets__actionBtn--danger"]}`} onClick={() => handleDelete(b.id, b.number)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
