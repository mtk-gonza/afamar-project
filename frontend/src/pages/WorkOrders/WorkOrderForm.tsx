import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useNotify } from "../../context/NotificationContext";
import type { WorkOrder, Client, Material, MaterialColor, MaterialThickness, AppOption } from "../../types";
import styles from "./WorkOrderForm.module.css";

export function WorkOrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useNotify();
  const isEdit = Boolean(id);
  const mounted = useRef(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [colors, setColors] = useState<MaterialColor[]>([]);
  const [thicknesses, setThicknesses] = useState<MaterialThickness[]>([]);
  const [bachaTypes, setBachaTypes] = useState<AppOption[]>([]);
  const [anafeTypes, setAnafeTypes] = useState<AppOption[]>([]);
  const [form, setForm] = useState({
    client_id: 0, material: "", color: "", thickness: "", bacha: "", anafe: "",
    deposit_received: 0, balance_due: 0, delivery_date: "", priority: "normal", notes: "",
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
    const results = await Promise.allSettled([
      api.getClients().then(setClients),
      api.getMaterials().then(setMaterials),
      api.getColors().then(setColors),
      api.getThicknesses().then(setThicknesses),
      api.getOptions("bacha_type").then(setBachaTypes),
      api.getOptions("anafe_type").then(setAnafeTypes),
    ]);
    const errors = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    if (errors.length > 0) {
      const msg = "Error al cargar datos del formulario";
      notify(msg, "error");
      if (mounted.current) setDataError(msg);
    }
    if (mounted.current) setDataLoading(false);
  }, [notify]);

  useEffect(() => {
    mounted.current = true;
    loadData();
    if (id) {
      api.getWorkOrder(Number(id)).then((o: WorkOrder) => {
        if (!mounted.current) return;
        setForm({
          client_id: o.client_id, material: o.material || "", color: o.color || "", thickness: o.thickness || "",
          bacha: o.bacha || "", anafe: o.anafe || "", deposit_received: o.deposit_received, balance_due: o.balance_due,
          delivery_date: o.delivery_date || "", priority: o.priority, notes: o.notes || "",
        });
      }).catch(() => notify("Error al cargar la orden de trabajo", "error"));
    }
    return () => { mounted.current = false; };
  }, [id, loadData, notify]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await api.updateWorkOrder(Number(id), form);
      } else {
        await api.createWorkOrder(form);
      }
      navigate("/work-orders");
    } finally {
      setSaving(false);
    }
  };

  if (dataError && !dataLoading) {
    return (
      <div className={styles.form}>
        <h2 className={styles.form__title}>{isEdit ? "Editar Orden" : "Nueva Orden de Trabajo"}</h2>
        <div className={styles.form__error}>
          <p>{dataError}</p>
          <button type="button" className={styles.form__submit} onClick={loadData}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <h2 className={styles.form__title}>{isEdit ? "Editar Orden" : "Nueva Orden de Trabajo"}</h2>
      <form className={styles.form__grid} onSubmit={handleSubmit}>
        <label className={styles.form__label}>Cliente *
          <select className={styles.form__input} name="client_id" value={form.client_id} onChange={handleChange} required disabled={dataLoading}>
            <option value={0}>{dataLoading ? "Cargando clientes..." : "Seleccionar..."}</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className={styles.form__label}>Material
          <select className={styles.form__input} name="material" value={form.material} onChange={handleChange} disabled={dataLoading}>
            <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
            {materials.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
        </label>
        <label className={styles.form__label}>Color
          <select className={styles.form__input} name="color" value={form.color} onChange={handleChange} disabled={dataLoading}>
            <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
            {colors.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </label>
        <label className={styles.form__label}>Espesor
          <select className={styles.form__input} name="thickness" value={form.thickness} onChange={handleChange} disabled={dataLoading}>
            <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
            {thicknesses.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
        </label>
        <label className={styles.form__label}>Bacha
          <select className={styles.form__input} name="bacha" value={form.bacha} onChange={handleChange} disabled={dataLoading}>
            <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
            {bachaTypes.map((o) => <option key={o.id} value={o.value}>{o.value}</option>)}
          </select>
        </label>
        <label className={styles.form__label}>Anafe
          <select className={styles.form__input} name="anafe" value={form.anafe} onChange={handleChange} disabled={dataLoading}>
            <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
            {anafeTypes.map((o) => <option key={o.id} value={o.value}>{o.value}</option>)}
          </select>
        </label>
        <label className={styles.form__label}>Seña recibida<input className={styles.form__input} name="deposit_received" type="number" value={form.deposit_received} onChange={handleChange} /></label>
        <label className={styles.form__label}>Saldo pendiente<input className={styles.form__input} name="balance_due" type="number" value={form.balance_due} onChange={handleChange} /></label>
        <label className={styles.form__label}>Fecha de entrega<input className={styles.form__input} name="delivery_date" type="date" value={form.delivery_date} onChange={handleChange} /></label>
        <label className={styles.form__label}>Prioridad
          <select className={styles.form__input} name="priority" value={form.priority} onChange={handleChange}>
            <option value="normal">Normal</option>
            <option value="urgent">Urgente</option>
          </select>
        </label>
        <label className={styles.form__label} style={{ gridColumn: "1 / -1" }}>Observaciones<textarea className={styles.form__textarea} name="notes" value={form.notes} onChange={handleChange} /></label>
        <div className={styles.form__actions} style={{ gridColumn: "1 / -1" }}>
          <button className={styles.form__submit} type="submit" disabled={saving || dataLoading}>{saving ? "Guardando..." : "Guardar"}</button>
          <button className={styles.form__cancel} type="button" onClick={() => navigate("/work-orders")}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
