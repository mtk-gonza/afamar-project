import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useNotify } from "../../context/NotificationContext";
import { useConfirm } from "../../components/ui/useConfirm";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { TableActions } from "../../components/ui/TableActions";
import { ListPage } from "../../components/ui/ListPage";
import { useApiList } from "../../hooks/useApiList";
import { formatARS, formatUSD, formatBalance, formatDate } from "../../utils/formatCurrency";
import { downloadPdf } from "../../utils/downloadPdf";
import type { Budget } from "../../types";
import styles from "./Budgets.module.css";

export function Budgets() {
  const navigate = useNavigate();
  const notify = useNotify();
  const { confirm, dialog } = useConfirm();
  const { items, loading, error, load } = useApiList(() => api.getBudgets(), "Error al cargar presupuestos");

  const handleApproval = async (b: Budget) => {
    if (b.status === "PENDING") {
      await api.updateBudget(b.id, { status: "APPROVED" });
      if (await confirm("¿Convertir a Orden de Trabajo?")) {
        await api.createFromBudget(b.id);
      }
    } else if (b.status === "APPROVED") {
      await api.updateBudget(b.id, { status: "REJECTED" });
    } else {
      await api.updateBudget(b.id, { status: "PENDING" });
    }
    load();
  };

  const handleDelete = async (id: number, num: string) => {
    if (!(await confirm(`¿Eliminar presupuesto ${num}?`, "Eliminar", true))) return;
    await api.deleteBudget(id);
    load();
  };

  const handleDownloadPdf = (b: Budget) =>
    downloadPdf(() => api.downloadBudgetPdf(b.id), `presupuesto_${b.number}.pdf`, (m) => notify(m, "error"));

  const handleSendEmail = async (b: Budget) => {
    try {
      await api.sendBudgetEmail(b.id);
      notify("Email enviado correctamente", "success");
    } catch {
      notify("Error al enviar email", "error");
    }
  };

  const handleSendWhatsApp = async (b: Budget) => {
    try {
      await api.sendBudgetWhatsApp(b.id);
      notify("WhatsApp enviado", "success");
    } catch {
      notify("Error al enviar WhatsApp", "error");
    }
  };

  return (
    <div className={styles.budgets}>
      <PageHeader title="Presupuestos" addLink="/admin/budgets/new" />

      <ListPage loading={loading} error={error} items={items} emptyMessage="No hay presupuestos aún." onRetry={load}>
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
                <td>{formatARS(b.total)}</td>
                <td>{formatUSD(b.total_usd)}</td>
                <td>{formatBalance(b.balance_due)}</td>
                <td>{formatDate(b.created_at)}</td>
                <TableActions onEdit={() => navigate(`/admin/budgets/${b.id}/edit`)} onDelete={() => handleDelete(b.id, b.number)}>
                  {b.status === "PENDING" && <button className={styles.budgets__actionBtn} onClick={() => handleApproval(b)}>Aprobar</button>}
                  <button className={styles.budgets__actionBtn} title="Descargar PDF" onClick={() => handleDownloadPdf(b)}>PDF</button>
                  <button className={styles.budgets__actionBtn} title="Enviar por email" onClick={() => handleSendEmail(b)}>Email</button>
                  <button className={styles.budgets__actionBtn} title="Enviar por WhatsApp" onClick={() => handleSendWhatsApp(b)}>WA</button>
                </TableActions>
              </tr>
            ))}
          </tbody>
        </table>
      </ListPage>
      {dialog}
    </div>
  );
}