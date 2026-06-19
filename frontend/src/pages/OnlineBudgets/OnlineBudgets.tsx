import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import { useNotify } from "../../context/NotificationContext";
import { useConfirm } from "../../components/ui/useConfirm";
import { PageHeader } from "../../components/ui/PageHeader";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorBlock } from "../../components/ui/ErrorBlock";
import { EmptyState } from "../../components/ui/EmptyState";
import { FormActions } from "../../components/ui/FormActions";
import { TableActions } from "../../components/ui/TableActions";
import type { OnlineBudget, PoolStock } from "../../types";
import styles from "./OnlineBudgets.module.css";

export function OnlineBudgets() {
  const notify = useNotify();
  const { confirm, dialog } = useConfirm();
  const [items, setItems] = useState<OnlineBudget[]>([]);
  const [poolStock, setPoolStock] = useState<PoolStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    client_name: "", work_type: "", date: "", usd_rate: 1000,
    items_raw: "", total_net_ars: 0, total_net_usd: 0, total_consolidated: 0,
    pool_id: 0, pool_price: 0,
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ob, ps] = await Promise.all([api.getOnlineBudgets(), api.getPoolStock()]);
      setItems(ob);
      setPoolStock(ps);
    } catch {
      setError("Error al cargar presupuestos online");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({ client_name: "", work_type: "", date: "", usd_rate: 1000, items_raw: "", total_net_ars: 0, total_net_usd: 0, total_consolidated: 0, pool_id: 0, pool_price: 0 });
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (ob: OnlineBudget) => {
    setForm({
      client_name: ob.client_name || "",
      work_type: ob.work_type || "",
      date: ob.date || "",
      usd_rate: ob.usd_rate,
      items_raw: ob.items_data || "",
      total_net_ars: ob.total_net_ars,
      total_net_usd: ob.total_net_usd,
      total_consolidated: ob.total_consolidated,
      pool_id: ob.pool_id || 0,
      pool_price: ob.pool_price,
    });
    setEditingId(ob.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      pool_id: form.pool_id > 0 ? form.pool_id : null,
      items_data: form.items_raw || null,
    };
    try {
      if (editingId) {
        await api.updateOnlineBudget(editingId, payload);
        notify("Presupuesto online actualizado", "success");
      } else {
        await api.createOnlineBudget(payload);
        notify("Presupuesto online creado", "success");
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
    if (!(await confirm("¿Eliminar presupuesto online?", "Eliminar", true))) return;
    try {
      await api.deleteOnlineBudget(id);
      load();
    } catch {
      notify("Error al eliminar", "error");
    }
  };

  return (
    <div className={styles.onlineBudgets}>
      <PageHeader title="Presupuestos Online">
        <button className={styles.onlineBudgets__addBtn} onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? "Cancelar" : "+ Nuevo Online"}
        </button>
      </PageHeader>

      {showForm && (
        <form className={styles.onlineBudgets__form} onSubmit={handleSubmit}>
          <div className={styles.onlineBudgets__grid2}>
            <label className={styles.onlineBudgets__label}>Cliente
              <input className={styles.onlineBudgets__input} value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required />
            </label>
            <label className={styles.onlineBudgets__label}>Tipo de trabajo
              <input className={styles.onlineBudgets__input} value={form.work_type} onChange={(e) => setForm({ ...form, work_type: e.target.value })} />
            </label>
            <label className={styles.onlineBudgets__label}>Fecha
              <input className={styles.onlineBudgets__input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="DD/MM/AAAA" />
            </label>
            <label className={styles.onlineBudgets__label}>Cotización USD
              <input className={styles.onlineBudgets__input} type="number" value={form.usd_rate} onChange={(e) => setForm({ ...form, usd_rate: Number(e.target.value) })} />
            </label>
            <label className={styles.onlineBudgets__label}>Total ARS
              <input className={styles.onlineBudgets__input} type="number" value={form.total_net_ars} onChange={(e) => setForm({ ...form, total_net_ars: Number(e.target.value) })} />
            </label>
            <label className={styles.onlineBudgets__label}>Total USD
              <input className={styles.onlineBudgets__input} type="number" value={form.total_net_usd} onChange={(e) => setForm({ ...form, total_net_usd: Number(e.target.value) })} />
            </label>
            <label className={styles.onlineBudgets__label}>Total Consolidado
              <input className={styles.onlineBudgets__input} type="number" value={form.total_consolidated} onChange={(e) => setForm({ ...form, total_consolidated: Number(e.target.value) })} />
            </label>
            <label className={styles.onlineBudgets__label}>Pool
              <select className={styles.onlineBudgets__input} value={form.pool_id} onChange={(e) => {
                const id = Number(e.target.value);
                const pool = poolStock.find((p) => p.id === id);
                setForm({ ...form, pool_id: id, pool_price: pool ? pool.price : 0 });
              }}>
                <option value={0}>Sin pool</option>
                {poolStock.map((p) => (
                  <option key={p.id} value={p.id}>{p.brand} {p.model}</option>
                ))}
              </select>
            </label>
            {form.pool_id > 0 && (
              <label className={styles.onlineBudgets__label}>Precio pool
                <input className={styles.onlineBudgets__input} type="number" value={form.pool_price} onChange={(e) => setForm({ ...form, pool_price: Number(e.target.value) })} />
              </label>
            )}
          </div>
          <label className={styles.onlineBudgets__label}>Items (JSON)
            <textarea className={styles.onlineBudgets__textarea} value={form.items_raw} onChange={(e) => setForm({ ...form, items_raw: e.target.value })} placeholder='[{"desc":"Mesada","qty":1,"price":50000}]' />
          </label>
          <FormActions loading={saving} submitLabel={editingId ? "Actualizar" : "Crear"} onCancel={resetForm} />
        </form>
      )}

      {loading && <LoadingSpinner />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState message="No hay presupuestos online." />}

      {!loading && !error && items.length > 0 && (
        <table className={styles.onlineBudgets__table}>
          <thead>
            <tr><th>Número</th><th>Cliente</th><th>Tipo</th><th>Total ARS</th><th>Total USD</th><th>Consolidado</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {items.map((ob) => (
              <tr key={ob.id}>
                <td>{ob.number}</td>
                <td>{ob.client_name || "-"}</td>
                <td>{ob.work_type || "-"}</td>
                <td>$ {ob.total_net_ars.toFixed(2)}</td>
                <td>US$ {ob.total_net_usd.toFixed(2)}</td>
                <td>$ {ob.total_consolidated.toFixed(2)}</td>
                <td>{ob.status}</td>
                <TableActions onEdit={() => openEdit(ob)} onDelete={() => handleDelete(ob.id)} />
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {dialog}
    </div>
  );
}
