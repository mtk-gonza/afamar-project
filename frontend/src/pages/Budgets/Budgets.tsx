import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useNotify } from "../../context/NotificationContext";
import { useConfirm } from "../../components/ui/useConfirm";
import { PageHeader } from "../../components/ui/PageHeader";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorBlock } from "../../components/ui/ErrorBlock";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { TableActions } from "../../components/ui/TableActions";
import type { Budget } from "../../types";
import styles from "./Budgets.module.css";

export function Budgets() {
  const navigate = useNavigate();
  const notify = useNotify();
  const { confirm, dialog } = useConfirm();
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
      if (await confirm("¿Convertir a Orden de Trabajo?")) {
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
    if (!(await confirm(`¿Eliminar presupuesto ${num}?`, "Eliminar", true))) return;
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

  const handleSendWhatsApp = async (b: Budget) => {
    try {
      await api.sendBudgetWhatsApp(b.id);
      notify("WhatsApp enviado", "success");
    } catch (e: any) {
      notify(e.message || "Error al enviar WhatsApp", "error");
    }
  };

  return (
    <div className={styles.budgets}>
      <PageHeader title="Presupuestos" addLink="/budgets/new" />

      {loading && <LoadingSpinner />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState message="No hay presupuestos aún." />}

      {!loading && !error && items.length > 0 && (
        <table className={styles.budgets__table}>
          <thead>
            <tr><th>Número</th><th>Cliente</th><th>Estado</th><th>Total ARS</th><th>Total USD</th><th>Saldo</th><th>Fecha</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b.id}>
                <td>{b.number}</td>
                <td>{b.client_id}</td>
                <td><StatusBadge status={b.status} /></td>
                <td>$ {b.total.toFixed(2)}</td>
                <td>{b.total_usd > 0 ? `US$ ${b.total_usd.toFixed(2)}` : "-"}</td>
                <td>{b.balance_due > 0 ? `$ ${b.balance_due.toFixed(2)}` : "Pagado"}</td>
                <td>{new Date(b.created_at).toLocaleDateString()}</td>
                <TableActions onEdit={() => navigate(`/budgets/${b.id}/edit`)} onDelete={() => handleDelete(b.id, b.number)}>
                  {b.status === "pending" && <button className={styles.budgets__actionBtn} onClick={() => handleApproval(b)}>Aprobar</button>}
                  <button className={styles.budgets__actionBtn} title="Descargar PDF" onClick={() => handleDownloadPdf(b)}>PDF</button>
                  <button className={styles.budgets__actionBtn} title="Enviar por email" onClick={() => handleSendEmail(b)}>Email</button>
                  <button className={styles.budgets__actionBtn} title="Enviar por WhatsApp" onClick={() => handleSendWhatsApp(b)}>WA</button>
                </TableActions>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {dialog}
    </div>
  );
}
