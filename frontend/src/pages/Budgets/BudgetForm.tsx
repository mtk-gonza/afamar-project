import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useNotify } from "../../context/NotificationContext";
import type { Budget, Client, Material, MaterialColor, MaterialThickness, AppOption } from "../../types";
import styles from "./BudgetForm.module.css";

interface ItemRow { description: string; quantity: number; unit_price: number; total: number }

const emptyItem = (): ItemRow => ({ description: "", quantity: 1, unit_price: 0, total: 0 });

export function BudgetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useNotify();
  const isEdit = Boolean(id);
  const mounted = useRef(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [colors, setColors] = useState<MaterialColor[]>([]);
  const [thicknesses, setThicknesses] = useState<MaterialThickness[]>([]);
  const [finishTypes, setFinishTypes] = useState<AppOption[]>([]);
  const [frontTypes, setFrontTypes] = useState<AppOption[]>([]);
  const [bachaTypes, setBachaTypes] = useState<AppOption[]>([]);
  const [anafeTypes, setAnafeTypes] = useState<AppOption[]>([]);

  const [clientId, setClientId] = useState(0);
  const [specs, setSpecs] = useState({ material: "", color: "", thickness: "", front: "", finish: "", bacha: "", anafe: "", perforations: "" });
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);

  const handleMaterialChange = (value: string) => {
    setSpecs({ ...specs, material: value });
    const material = materials.find((m) => m.name === value);
    if (material && material.base_price > 0) {
      setItems((prev) => {
        const next = [...prev];
        if (next.length > 0 && !next[0].description) {
          next[0] = { ...next[0], unit_price: material.base_price, total: next[0].quantity * material.base_price };
        }
        return next;
      });
    }
  };
  const [payment, setPayment] = useState({ payment_method: "", validity_days: 15, estimated_delivery: "", estimated_date: "", notes: "" });
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
      api.getOptions("finish_type").then(setFinishTypes),
      api.getOptions("front_type").then(setFrontTypes),
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
      api.getBudget(Number(id)).then((b: Budget) => {
        if (!mounted.current) return;
        setClientId(b.client_id);
        setSpecs({ material: b.material || "", color: b.color || "", thickness: b.thickness || "", front: b.front || "", finish: b.finish || "", bacha: b.bacha || "", anafe: b.anafe || "", perforations: b.perforations || "" });
        setItems(b.items.map((i) => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price, total: i.total })));
        setPayment({ payment_method: b.payment_method || "", validity_days: b.validity_days, estimated_delivery: b.estimated_delivery || "", estimated_date: b.estimated_date || "", notes: b.notes || "" });
      }).catch(() => notify("Error al cargar el presupuesto", "error"));
    }
    return () => { mounted.current = false; };
  }, [id, loadData, notify]);

  const updateItem = (idx: number, field: keyof ItemRow, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "quantity" || field === "unit_price") {
        next[idx].total = Number((next[idx].quantity * next[idx].unit_price).toFixed(2));
      }
      return next;
    });
  };

  const addItem = () => setItems([...items, emptyItem()]);
  const removeItem = (idx: number) => items.length > 1 && setItems(items.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const shipping = 0;
  const total = subtotal + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      client_id: clientId,
      ...specs,
      subtotal, shipping, total,
      ...payment,
      items: items.filter((i) => i.description),
    };
    try {
      if (isEdit) {
        await api.updateBudget(Number(id), payload);
      } else {
        await api.createBudget(payload);
      }
      navigate("/budgets");
    } finally {
      setSaving(false);
    }
  };

  if (dataError && !dataLoading) {
    return (
      <div className={styles.budgetForm}>
        <h2 className={styles.budgetForm__title}>{isEdit ? "Editar Presupuesto" : "Nuevo Presupuesto"}</h2>
        <div className={styles.budgetForm__error}>
          <p>{dataError}</p>
          <button type="button" className={styles.budgetForm__submit} onClick={loadData}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.budgetForm}>
      <h2 className={styles.budgetForm__title}>{isEdit ? "Editar Presupuesto" : "Nuevo Presupuesto"}</h2>
      <form className={styles.budgetForm__form} onSubmit={handleSubmit}>
        <fieldset className={styles.budgetForm__fieldset}>
          <legend>Cliente</legend>
          <select className={styles.budgetForm__input} value={clientId} onChange={(e) => setClientId(Number(e.target.value))} required disabled={dataLoading}>
            <option value={0}>{dataLoading ? "Cargando clientes..." : "Seleccionar cliente..."}</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </fieldset>

        <fieldset className={styles.budgetForm__fieldset}>
          <legend>Especificaciones</legend>
          <div className={styles.budgetForm__grid2}>
            <label className={styles.budgetForm__label}>Material
              <select className={styles.budgetForm__input} value={specs.material} onChange={(e) => handleMaterialChange(e.target.value)} disabled={dataLoading}>
                <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
                {materials.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
            </label>
            <label className={styles.budgetForm__label}>Color
              <select className={styles.budgetForm__input} value={specs.color} onChange={(e) => setSpecs({ ...specs, color: e.target.value })} disabled={dataLoading}>
                <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
                {colors.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </label>
            <label className={styles.budgetForm__label}>Espesor
              <select className={styles.budgetForm__input} value={specs.thickness} onChange={(e) => setSpecs({ ...specs, thickness: e.target.value })} disabled={dataLoading}>
                <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
                {thicknesses.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </label>
            <label className={styles.budgetForm__label}>Frente
              <select className={styles.budgetForm__input} value={specs.front} onChange={(e) => setSpecs({ ...specs, front: e.target.value })} disabled={dataLoading}>
                <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
                {frontTypes.map((o) => <option key={o.id} value={o.value}>{o.value}</option>)}
              </select>
            </label>
            <label className={styles.budgetForm__label}>Terminación
              <select className={styles.budgetForm__input} value={specs.finish} onChange={(e) => setSpecs({ ...specs, finish: e.target.value })} disabled={dataLoading}>
                <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
                {finishTypes.map((o) => <option key={o.id} value={o.value}>{o.value}</option>)}
              </select>
            </label>
            <label className={styles.budgetForm__label}>Bacha
              <select className={styles.budgetForm__input} value={specs.bacha} onChange={(e) => setSpecs({ ...specs, bacha: e.target.value })} disabled={dataLoading}>
                <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
                {bachaTypes.map((o) => <option key={o.id} value={o.value}>{o.value}</option>)}
              </select>
            </label>
            <label className={styles.budgetForm__label}>Anafe
              <select className={styles.budgetForm__input} value={specs.anafe} onChange={(e) => setSpecs({ ...specs, anafe: e.target.value })} disabled={dataLoading}>
                <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
                {anafeTypes.map((o) => <option key={o.id} value={o.value}>{o.value}</option>)}
              </select>
            </label>
            <label className={styles.budgetForm__label}>Perforaciones
              <input className={styles.budgetForm__input} value={specs.perforations} onChange={(e) => setSpecs({ ...specs, perforations: e.target.value })} />
            </label>
          </div>
        </fieldset>

        <fieldset className={styles.budgetForm__fieldset}>
          <legend>Items</legend>
          <div className={styles.budgetForm__itemsHeader}>
            <span>Descripción</span><span>Cant.</span><span>P. Unit.</span><span>Total</span><span></span>
          </div>
          {items.map((item, i) => (
            <div key={i} className={styles.budgetForm__itemRow}>
              <input className={styles.budgetForm__input} value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} placeholder="Descripción" />
              <input className={styles.budgetForm__input} type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} />
              <input className={styles.budgetForm__input} type="number" value={item.unit_price} onChange={(e) => updateItem(i, "unit_price", Number(e.target.value))} />
              <span className={styles.budgetForm__itemTotal}>$ {item.total.toFixed(2)}</span>
              <button type="button" className={styles.budgetForm__removeItem} onClick={() => removeItem(i)}>✕</button>
            </div>
          ))}
          <button type="button" className={styles.budgetForm__addItem} onClick={addItem}>+ Agregar item</button>
          <div className={styles.budgetForm__totals}>
            <span>Subtotal: $ {subtotal.toFixed(2)}</span>
            <span>Total: $ {total.toFixed(2)}</span>
          </div>
        </fieldset>

        <fieldset className={styles.budgetForm__fieldset}>
          <legend>Información comercial</legend>
          <div className={styles.budgetForm__grid2}>
            <label className={styles.budgetForm__label}>Forma de pago
              <select className={styles.budgetForm__input} value={payment.payment_method} onChange={(e) => setPayment({ ...payment, payment_method: e.target.value })}>
                <option value="">Seleccionar...</option>
                <option value="cash">Efectivo</option>
                <option value="transfer">Transferencia Bancaria</option>
                <option value="card">Tarjeta</option>
              </select>
            </label>
            <label className={styles.budgetForm__label}>Validez (días)<input className={styles.budgetForm__input} type="number" value={payment.validity_days} onChange={(e) => setPayment({ ...payment, validity_days: Number(e.target.value) })} /></label>
            <label className={styles.budgetForm__label}>Entrega aproximada<input className={styles.budgetForm__input} value={payment.estimated_delivery} onChange={(e) => setPayment({ ...payment, estimated_delivery: e.target.value })} /></label>
            <label className={styles.budgetForm__label}>Fecha estimada<input className={styles.budgetForm__input} type="date" value={payment.estimated_date} onChange={(e) => setPayment({ ...payment, estimated_date: e.target.value })} /></label>
          </div>
          <label className={styles.budgetForm__label} style={{ marginTop: "0.5rem" }}>Observaciones
            <textarea className={styles.budgetForm__textarea} value={payment.notes} onChange={(e) => setPayment({ ...payment, notes: e.target.value })} />
          </label>
        </fieldset>

        <div className={styles.budgetForm__actions}>
          <button className={styles.budgetForm__submit} type="submit" disabled={saving || dataLoading}>{saving ? "Guardando..." : "Guardar"}</button>
          <button className={styles.budgetForm__cancel} type="button" onClick={() => navigate("/budgets")}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
