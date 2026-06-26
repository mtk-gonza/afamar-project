import { useState } from "react";
import { api } from "../../api/client";
import { useNotify } from "../../context/NotificationContext";
import { useConfirm } from "../../components/ui/useConfirm";
import { PageHeader } from "../../components/ui/PageHeader";
import { TableActions } from "../../components/ui/TableActions";
import { ListPage } from "../../components/ui/ListPage";
import { useApiList } from "../../hooks/useApiList";
import { formatDate } from "../../utils/formatCurrency";
import { MEASUREMENT_STATUSES } from "../../constants";
import { t } from "../../utils/translate";
import { MeasurementForm } from "./MeasurementForm";
import type { Measurement } from "../../types";
import styles from "./Measurements.module.css";

function photoCount(m: Measurement): number {
  if (!m.photos_data) return 0;
  try {
    const p = JSON.parse(m.photos_data);
    return Array.isArray(p) ? p.length : 0;
  } catch {
    return 0;
  }
}

export function Measurements() {
  const notify = useNotify();
  const { confirm, dialog } = useConfirm();
  const { items, loading, error, load } = useApiList(() => api.getMeasurements(), "Error al cargar mediciones");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!(await confirm("¿Eliminar medición?", "Eliminar", true))) return;
    try {
      await api.deleteMeasurement(id);
      load();
    } catch {
      notify("Error al eliminar", "error");
    }
  };

  const handleStatusChange = async (m: Measurement, status: string) => {
    try {
      await api.updateMeasurement(m.id, { status });
      load();
    } catch {
      notify("Error al actualizar estado", "error");
    }
  };

  const openEdit = (m: Measurement) => {
    setEditingId(m.id);
    setShowForm(true);
  };

  const onSaved = () => {
    setShowForm(false);
    setEditingId(null);
    load();
  };

  return (
    <div className={styles.measurements}>
      <PageHeader title="Mediciones">
        <button className={styles.measurements__addBtn} onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
          {showForm ? "Cancelar" : "+ Nueva Medición"}
        </button>
      </PageHeader>

      {showForm && (
        <MeasurementForm
          editingId={editingId}
          onSaved={onSaved}
          onCancel={() => { setShowForm(false); setEditingId(null); }}
        />
      )}

      <ListPage loading={loading} error={error} items={items} emptyMessage="No hay mediciones aún." onRetry={load}>
        <table className={styles.measurements__table}>
          <thead>
            <tr><th>Cliente</th><th>Teléfono</th><th>Fecha</th><th>Horario</th><th>Fotos</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id}>
                <td>{m.client_name || "-"}</td>
                <td>{m.client_phone || "-"}</td>
                <td>{m.scheduled_date ? formatDate(m.scheduled_date) : "-"}</td>
                <td>{m.scheduled_time || "-"}</td>
                <td>{(() => { const c = photoCount(m); return c > 0 ? `${c} foto${c > 1 ? "s" : ""}` : "-"; })()}</td>
                <td>
                  <select className={styles.measurements__statusSelect} value={m.status} onChange={(e) => handleStatusChange(m, e.target.value)}>
                    {Object.values(MEASUREMENT_STATUSES).map((k) => (
                      <option key={k} value={k}>{t(k)}</option>
                    ))}
                  </select>
                </td>
                <TableActions onEdit={() => openEdit(m)} onDelete={() => handleDelete(m.id)} />
              </tr>
            ))}
          </tbody>
        </table>
      </ListPage>
      {dialog}
    </div>
  );
}
