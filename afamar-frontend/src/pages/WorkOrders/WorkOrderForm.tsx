import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useNotify } from "../../context/NotificationContext";
import { ErrorBlock } from "../../components/ui/ErrorBlock";
import { FormActions } from "../../components/ui/FormActions";
import { SketchEditor } from "../../components/SketchEditor/SketchEditor";
import { SignaturePad } from "../../components/SignaturePad/SignaturePad";
import type { WorkOrder, Client, Material, MaterialColor, MaterialThickness, AppOption, PoolStock, SketchPage } from "../../types";
import styles from "./WorkOrderForm.module.css";

interface FabItemRow { _key: number; concept: string; detail: string; m2: number; material: string }

let _fabKey = 1;
const fabKey = () => _fabKey++;
const emptyFabItem = (): FabItemRow => ({ _key: fabKey(), concept: "", detail: "", m2: 0, material: "" });

const STATUS_ORDER = ["measurement", "budgeted", "in_production", "finished", "delivered"] as const;
type OrderStatus = (typeof STATUS_ORDER)[number];

const STATUS_LABELS: Record<string, string> = {
  measurement: "Medición",
  budgeted: "Presupuestado",
  in_production: "En Producción",
  finished: "Finalizado",
  delivered: "Entregado",
};

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
  const [pools, setPools] = useState<PoolStock[]>([]);
  const [form, setForm] = useState({
    client_id: 0,
    client_name: "", client_phone: "", client_email: "", client_address: "",
    status: "measurement",
    material: "", color: "", thickness: "", bacha: "", anafe: "",
    currency: "ARS", usd_rate: 0,
    subtotal: 0, transport: 0, installation: 0, discount: 0, total: 0,
    subtotal_usd: 0, transport_usd: 0, total_usd: 0,
    deposit_received: 0, deposit_currency: "ARS", deposit_usd: 0,
    balance_due: 0, balance_due_usd: 0, balance_paid: false,
    payment_method: "", installments: 1,
    priority: "normal", delivery_date: "", notes: "",
    fabrication_details: "", budgeted_details: "",
    design_observations: "", important_observations: "",
    pool_id: 0, pool_price: 0, pool_currency: "ARS",
    snapshot_name: "", snapshot_phone: "", snapshot_email: "", snapshot_address: "",
  });
  const [nextNumber, setNextNumber] = useState("");
  const [sketchPages, setSketchPages] = useState<SketchPage[]>([]);
  const [digitalSignature, setDigitalSignature] = useState<string | null>(null);
  const [fabItems, setFabItems] = useState<FabItemRow[]>([emptyFabItem()]);
  const [budgetedItems, setBudgetedItems] = useState<FabItemRow[]>([emptyFabItem()]);
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
      api.getPoolStock().then(setPools),
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
    api.getNextWorkOrderNumber().then((res) => {
      if (mounted.current) setNextNumber(res.number);
    }).catch(() => {});
    if (id) {
      api.getWorkOrder(Number(id)).then((o: WorkOrder) => {
        if (!mounted.current) return;
        setForm({
          client_id: o.client_id,
          client_name: "", client_phone: "", client_email: "", client_address: "",
          status: o.status,
          material: o.material || "", color: o.color || "", thickness: o.thickness || "",
          bacha: o.bacha || "", anafe: o.anafe || "",
          currency: o.currency, usd_rate: o.usd_rate,
          subtotal: o.subtotal, transport: o.transport, installation: o.installation, discount: o.discount, total: o.total,
          subtotal_usd: o.subtotal_usd, transport_usd: o.transport_usd, total_usd: o.total_usd,
          deposit_received: o.deposit_received, deposit_currency: o.deposit_currency, deposit_usd: o.deposit_usd,
          balance_due: o.balance_due, balance_due_usd: o.balance_due_usd, balance_paid: o.balance_paid,
          payment_method: o.payment_method || "", installments: o.installments,
          priority: o.priority, delivery_date: o.delivery_date || "", notes: o.notes || "",
          fabrication_details: o.fabrication_details || "", budgeted_details: o.budgeted_details || "",
          design_observations: o.design_observations || "", important_observations: o.important_observations || "",
          pool_id: o.pool_id || 0, pool_price: o.pool_price, pool_currency: o.pool_currency,
          snapshot_name: o.snapshot_name || "", snapshot_phone: o.snapshot_phone || "",
          snapshot_email: o.snapshot_email || "", snapshot_address: o.snapshot_address || "",
        });
        if (o.digital_signature) setDigitalSignature(o.digital_signature);
        try {
          const parsed = JSON.parse(o.fabrication_details || "[]");
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFabItems(parsed.map((i: any) => ({ _key: fabKey(), concept: i.concept || "", detail: i.detail || "", m2: i.m2 || 0, material: i.material || "" })));
          }
        } catch {}
        try {
          const parsed = JSON.parse(o.budgeted_details || "[]");
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBudgetedItems(parsed.map((i: any) => ({ _key: fabKey(), concept: i.concept || "", detail: i.detail || "", m2: i.m2 || 0, material: i.material || "" })));
          }
        } catch {}
      }).catch(() => notify("Error al cargar la orden de trabajo", "error"));
    }
    return () => { mounted.current = false; };
  }, [id, loadData, notify]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const updateFabItem = (idx: number, field: keyof Omit<FabItemRow, "_key">, value: string | number) => {
    setFabItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };
  const addFabItem = () => setFabItems([...fabItems, emptyFabItem()]);
  const removeFabItem = (idx: number) => fabItems.length > 1 && setFabItems(fabItems.filter((_, i) => i !== idx));

  const updateBudgetedItem = (idx: number, field: keyof Omit<FabItemRow, "_key">, value: string | number) => {
    setBudgetedItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };
  const addBudgetedItem = () => setBudgetedItems([...budgetedItems, emptyFabItem()]);
  const removeBudgetedItem = (idx: number) => budgetedItems.length > 1 && setBudgetedItems(budgetedItems.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id && !form.client_name) {
      notify("Seleccioná un cliente o ingresá un nombre", "error");
      return;
    }
    setSaving(true);
    const onlyFab = fabItems.filter((i) => i.concept || i.detail);
    const onlyBud = budgetedItems.filter((i) => i.concept || i.detail);
    const payload = {
      ...form,
      digital_signature: digitalSignature,
      fabrication_details: onlyFab.length > 0 ? JSON.stringify(onlyFab.map(({ _key: _, ...i }) => i)) : form.fabrication_details,
      budgeted_details: onlyBud.length > 0 ? JSON.stringify(onlyBud.map(({ _key: _, ...i }) => i)) : form.budgeted_details,
    };
    try {
      if (isEdit) {
        await api.updateWorkOrder(Number(id), payload);
      } else {
        await api.createWorkOrder(payload);
      }
      navigate("/admin/work-orders");
    } catch {
      notify("Error al guardar la orden de trabajo", "error");
    } finally {
      setSaving(false);
    }
  };

  if (dataError && !dataLoading) {
    return (
      <div className={styles.form}>
        <h2 className={styles.form__title}>{isEdit ? "Editar Orden" : "Nueva Orden de Trabajo"}</h2>
        <ErrorBlock message={dataError} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <h2 className={styles.form__title}>
        {isEdit ? "Editar Orden" : "Nueva Orden de Trabajo"}
        {nextNumber && !isEdit && <span className={styles.form__nextNumber}> — Nº {nextNumber}</span>}
      </h2>
      <form className={styles.form__grid} onSubmit={handleSubmit}>

        <label className={styles.form__label}>Cliente *
          <select className={styles.form__input} name="client_id" value={form.client_id} onChange={handleChange} disabled={dataLoading}>
            <option value={0}>{dataLoading ? "Cargando clientes..." : "Seleccionar..."}</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {form.client_id === 0 && (
            <div className={styles.form__clientFields}>
              <input className={styles.form__input} name="client_name" placeholder="Nombre del cliente *" value={form.client_name} onChange={handleChange} />
              <input className={styles.form__input} name="client_phone" placeholder="Teléfono" value={form.client_phone} onChange={handleChange} />
              <input className={styles.form__input} name="client_email" placeholder="Email" value={form.client_email} onChange={handleChange} />
              <input className={styles.form__input} name="client_address" placeholder="Dirección" value={form.client_address} onChange={handleChange} />
            </div>
          )}
        </label>

        <label className={styles.form__label}>Estado
          <div className={styles.form__statusRow}>
            {STATUS_ORDER.map((s) => {
              const currentIdx = STATUS_ORDER.indexOf(form.status as OrderStatus);
              const thisIdx = STATUS_ORDER.indexOf(s);
              const canTransition = isEdit ? thisIdx >= currentIdx : true;
              return (
                <button
                  key={s}
                  type="button"
                  className={`${styles.form__statusBtn} ${form.status === s ? styles["form__statusBtn--active"] : ""} ${!canTransition ? styles["form__statusBtn--disabled"] : ""}`}
                  disabled={!canTransition}
                  onClick={() => setForm({ ...form, status: s })}
                >
                  {STATUS_LABELS[s] || s}
                </button>
              );
            })}
          </div>
        </label>

        <label className={styles.form__label}>Prioridad
          <select className={styles.form__input} name="priority" value={form.priority} onChange={handleChange}>
            <option value="normal">Normal</option>
            <option value="urgent">Urgente</option>
          </select>
        </label>

        <label className={styles.form__label}>Fecha de entrega
          <input className={styles.form__input} name="delivery_date" type="date" value={form.delivery_date} onChange={handleChange} />
        </label>

        <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
          <legend>Especificaciones</legend>
          <div className={styles.form__grid}>
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
          </div>
        </fieldset>

        <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
          <legend>Detalles presupuestados</legend>
          <div className={styles.form__itemsHeader}>
            <span>Concepto</span><span>Detalle</span><span>M²</span><span>Material</span><span></span>
          </div>
          {budgetedItems.map((item, i) => (
            <div key={item._key} className={styles.form__itemRow}>
              <input className={styles.form__input} value={item.concept} onChange={(e) => updateBudgetedItem(i, "concept", e.target.value)} placeholder="Concepto" />
              <input className={styles.form__input} value={item.detail} onChange={(e) => updateBudgetedItem(i, "detail", e.target.value)} placeholder="Detalle" />
              <input className={styles.form__input} type="number" step="0.01" value={item.m2 || ""} onChange={(e) => updateBudgetedItem(i, "m2", Number(e.target.value))} />
              <input className={styles.form__input} value={item.material} onChange={(e) => updateBudgetedItem(i, "material", e.target.value)} placeholder="Material" />
              <button type="button" className={styles.form__removeItem} onClick={() => removeBudgetedItem(i)}>✕</button>
            </div>
          ))}
          <button type="button" className={styles.form__addItem} onClick={addBudgetedItem}>+ Agregar item</button>
        </fieldset>

        <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
          <legend>Detalles de fabricación</legend>
          <div className={styles.form__itemsHeader}>
            <span>Concepto</span><span>Detalle</span><span>M²</span><span>Material</span><span></span>
          </div>
          {fabItems.map((item, i) => (
            <div key={item._key} className={styles.form__itemRow}>
              <input className={styles.form__input} value={item.concept} onChange={(e) => updateFabItem(i, "concept", e.target.value)} placeholder="Concepto" />
              <input className={styles.form__input} value={item.detail} onChange={(e) => updateFabItem(i, "detail", e.target.value)} placeholder="Detalle" />
              <input className={styles.form__input} type="number" step="0.01" value={item.m2 || ""} onChange={(e) => updateFabItem(i, "m2", Number(e.target.value))} />
              <input className={styles.form__input} value={item.material} onChange={(e) => updateFabItem(i, "material", e.target.value)} placeholder="Material" />
              <button type="button" className={styles.form__removeItem} onClick={() => removeFabItem(i)}>✕</button>
            </div>
          ))}
          <button type="button" className={styles.form__addItem} onClick={addFabItem}>+ Agregar item</button>
        </fieldset>

        <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
          <legend>Observaciones</legend>
          <label className={styles.form__label}>
            Observaciones de diseño
            <textarea className={styles.form__textarea} name="design_observations" value={form.design_observations} onChange={handleChange} />
          </label>
          <label className={styles.form__label}>
            Observaciones importantes
            <textarea className={styles.form__textarea} name="important_observations" value={form.important_observations} onChange={handleChange} />
          </label>
        </fieldset>

        <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
          <legend>Croquis / Diseño</legend>
          <SketchEditor croquis={sketchPages} onChange={setSketchPages} />
        </fieldset>

        <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
          <legend>Firma digital</legend>
          <SignaturePad value={digitalSignature} onChange={setDigitalSignature} />
        </fieldset>

        <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
          <legend>Pileta</legend>
          <div className={styles.form__grid}>
            <label className={styles.form__label}>Pileta
              <select className={styles.form__input} name="pool_id" value={form.pool_id} onChange={handleChange} disabled={dataLoading}>
                <option value={0}>Sin pileta</option>
                {pools.map((p) => <option key={p.id} value={p.id}>{p.brand} {p.model}</option>)}
              </select>
            </label>
            <label className={styles.form__label}>Precio pileta
              <input className={styles.form__input} name="pool_price" type="number" step="0.01" value={form.pool_price} onChange={handleChange} />
            </label>
            <label className={styles.form__label}>Moneda pileta
              <select className={styles.form__input} name="pool_currency" value={form.pool_currency} onChange={handleChange}>
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
          <legend>Moneda y cotización</legend>
          <div className={styles.form__grid}>
            <label className={styles.form__label}>Moneda
              <select className={styles.form__input} name="currency" value={form.currency} onChange={handleChange}>
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </label>
            <label className={styles.form__label}>Cotización USD
              <input className={styles.form__input} name="usd_rate" type="number" step="0.01" value={form.usd_rate} onChange={handleChange} />
            </label>
          </div>
        </fieldset>

        <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
          <legend>Valores ARS</legend>
          <div className={styles.form__grid2}>
            <label className={styles.form__label}>Subtotal
              <input className={styles.form__input} name="subtotal" type="number" step="0.01" value={form.subtotal} onChange={handleChange} />
            </label>
            <label className={styles.form__label}>Transporte
              <input className={styles.form__input} name="transport" type="number" step="0.01" value={form.transport} onChange={handleChange} />
            </label>
            <label className={styles.form__label}>Instalación
              <input className={styles.form__input} name="installation" type="number" step="0.01" value={form.installation} onChange={handleChange} />
            </label>
            <label className={styles.form__label}>Descuento
              <input className={styles.form__input} name="discount" type="number" step="0.01" value={form.discount} onChange={handleChange} />
            </label>
            <label className={styles.form__label}>Total ARS
              <input className={styles.form__input} name="total" type="number" step="0.01" value={form.total} onChange={handleChange} />
            </label>
          </div>
        </fieldset>

        <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
          <legend>Valores USD</legend>
          <div className={styles.form__grid2}>
            <label className={styles.form__label}>Subtotal USD
              <input className={styles.form__input} name="subtotal_usd" type="number" step="0.01" value={form.subtotal_usd} onChange={handleChange} />
            </label>
            <label className={styles.form__label}>Transporte USD
              <input className={styles.form__input} name="transport_usd" type="number" step="0.01" value={form.transport_usd} onChange={handleChange} />
            </label>
            <label className={styles.form__label}>Total USD
              <input className={styles.form__input} name="total_usd" type="number" step="0.01" value={form.total_usd} onChange={handleChange} />
            </label>
          </div>
        </fieldset>

        <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
          <legend>Información de pago</legend>
          <div className={styles.form__grid2}>
            <label className={styles.form__label}>Seña recibida
              <input className={styles.form__input} name="deposit_received" type="number" step="0.01" value={form.deposit_received} onChange={handleChange} />
            </label>
            <label className={styles.form__label}>Moneda seña
              <select className={styles.form__input} name="deposit_currency" value={form.deposit_currency} onChange={handleChange}>
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </label>
            <label className={styles.form__label}>Seña USD
              <input className={styles.form__input} name="deposit_usd" type="number" step="0.01" value={form.deposit_usd} onChange={handleChange} />
            </label>
            <label className={styles.form__label}>Saldo pendiente ARS
              <input className={styles.form__input} name="balance_due" type="number" step="0.01" value={form.balance_due} onChange={handleChange} />
            </label>
            <label className={styles.form__label}>Saldo pendiente USD
              <input className={styles.form__input} name="balance_due_usd" type="number" step="0.01" value={form.balance_due_usd} onChange={handleChange} />
            </label>
            <label className={`${styles.form__label} ${styles.form__checkboxRow}`}>
              <input name="balance_paid" type="checkbox" checked={form.balance_paid} onChange={(e) => setForm({ ...form, balance_paid: e.target.checked })} />
              Pagado
            </label>
            <label className={styles.form__label}>Método de pago
              <input className={styles.form__input} name="payment_method" value={form.payment_method} onChange={handleChange} />
            </label>
            <label className={styles.form__label}>Cuotas
              <input className={styles.form__input} name="installments" type="number" value={form.installments} onChange={handleChange} />
            </label>
          </div>
        </fieldset>

        <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
          <legend>Datos del cliente (snapshot)</legend>
          <div className={styles.form__grid}>
            <label className={styles.form__label}>Nombre
              <input className={styles.form__input} name="snapshot_name" value={form.snapshot_name} onChange={handleChange} />
            </label>
            <label className={styles.form__label}>Teléfono
              <input className={styles.form__input} name="snapshot_phone" value={form.snapshot_phone} onChange={handleChange} />
            </label>
            <label className={styles.form__label}>Email
              <input className={styles.form__input} name="snapshot_email" value={form.snapshot_email} onChange={handleChange} />
            </label>
            <label className={styles.form__label}>Dirección
              <input className={styles.form__input} name="snapshot_address" value={form.snapshot_address} onChange={handleChange} />
            </label>
          </div>
        </fieldset>

        <label className={`${styles.form__label} ${styles["form__label--full"]}`}>
          Observaciones generales
          <textarea className={styles.form__textarea} name="notes" value={form.notes} onChange={handleChange} />
        </label>

        <FormActions loading={saving || dataLoading} />
      </form>
    </div>
  );
}
