import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import { useNotify } from "../../context/NotificationContext";
import { useConfirm } from "../../components/ui/useConfirm";
import { PageHeader } from "../../components/ui/PageHeader";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorBlock } from "../../components/ui/ErrorBlock";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { FormActions } from "../../components/ui/FormActions";
import { TableActions } from "../../components/ui/TableActions";
import type { Measurement } from "../../types";
import styles from "./Measurements.module.css";

export function Measurements() {
  const notify = useNotify();
  const { confirm, dialog } = useConfirm();
  const [items, setItems] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ client_name: "", client_phone: "", client_address: "", scheduled_date: "", scheduled_time: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await api.getMeasurements());
    } catch {
      setError("Error al cargar mediciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({ client_name: "", client_phone: "", client_address: "", scheduled_date: "", scheduled_time: "", notes: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (m: Measurement) => {
    setForm({
      client_name: m.client_name || "",
      client_phone: m.client_phone || "",
      client_address: m.client_address || "",
      scheduled_date: m.scheduled_date ? m.scheduled_date.slice(0, 16) : "",
      scheduled_time: m.scheduled_time || "",
      notes: m.notes || "",
    });
    setEditingId(m.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.updateMeasurement(editingId, form);
        notify("Medición actualizada", "success");
      } else {
        await api.createMeasurement(form);
        notify("Medición creada", "success");
      }
      resetForm();
      load();
    } catch (err: any) {
      notify(err.message || "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className={styles.measurements}>
      <PageHeader title="Mediciones">
        <button className={styles.measurements__addBtn} onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? "Cancelar" : "+ Nueva Medición"}
        </button>
      </PageHeader>

      {showForm && (
        <form className={styles.measurements__form} onSubmit={handleSubmit}>
          <div className={styles.measurements__grid2}>
            <label className={styles.measurements__label}>Cliente
              <input className={styles.measurements__input} value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required />
            </label>
            <label className={styles.measurements__label}>Teléfono
              <input className={styles.measurements__input} value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} />
            </label>
            <label className={styles.measurements__label}>Dirección
              <input className={styles.measurements__input} value={form.client_address} onChange={(e) => setForm({ ...form, client_address: e.target.value })} />
            </label>
            <label className={styles.measurements__label}>Fecha
              <input className={styles.measurements__input} type="datetime-local" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
            </label>
            <label className={styles.measurements__label}>Horario
              <input className={styles.measurements__input} value={form.scheduled_time} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} placeholder="Ej: 10:00" />
            </label>
          </div>
          <label className={styles.measurements__label}>Notas
            <textarea className={styles.measurements__textarea} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>
          <FormActions loading={saving} submitLabel={editingId ? "Actualizar" : "Crear"} onCancel={resetForm} />
        </form>
      )}

      {loading && <LoadingSpinner />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState message="No hay mediciones aún." />}

      {!loading && !error && items.length > 0 && (
        <table className={styles.measurements__table}>
          <thead>
            <tr><th>Cliente</th><th>Teléfono</th><th>Fecha</th><th>Horario</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id}>
                <td>{m.client_name || "-"}</td>
                <td>{m.client_phone || "-"}</td>
                <td>{m.scheduled_date ? new Date(m.scheduled_date).toLocaleDateString() : "-"}</td>
                <td>{m.scheduled_time || "-"}</td>
                <td>
                  <select
                    className={styles.measurements__statusSelect}
                    value={m.status}
                    onChange={(e) => handleStatusChange(m, e.target.value)}
                  >
                    {["PENDIENTE", "REALIZADO", "CANCELADO"].map((k) => (
                      <option key={k} value={k}><StatusBadge status={k} /></option>
                    ))}
                  </select>
                </td>
                <TableActions onEdit={() => openEdit(m)} onDelete={() => handleDelete(m.id)} />
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {dialog}
    </div>
  );
}
