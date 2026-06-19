import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useNotify } from "../../context/NotificationContext";
import { ErrorBlock } from "../../components/ui/ErrorBlock";
import { FormActions } from "../../components/ui/FormActions";
import type { Budget, Client, Material, MaterialColor, MaterialThickness, AppOption, PoolStock } from "../../types";
import styles from "./BudgetForm.module.css";

interface ItemRow { _key: number; description: string; quantity: number; unit_price: number; total: number; length: number; width: number; m2: number; price_m2: number }
interface AdicionalRow { _key: number; concept: string; detail: string; quantity: number; unit_price: number; total: number }

let _nextKey = 1;
const key = () => _nextKey++;
const emptyItem = (): ItemRow => ({ _key: key(), description: "", quantity: 1, unit_price: 0, total: 0, length: 0, width: 0, m2: 0, price_m2: 0 });
const emptyAdicional = (): AdicionalRow => ({ _key: key(), concept: "", detail: "", quantity: 1, unit_price: 0, total: 0 });

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
  const [poolStock, setPoolStock] = useState<PoolStock[]>([]);

  const [clientId, setClientId] = useState(0);
  const [specs, setSpecs] = useState({ material: "", color: "", thickness: "", front: "", finish: "", bacha: "", anafe: "", perforations: "" });
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
  const [adicionales, setAdicionales] = useState<AdicionalRow[]>([]);
  const [currency, setCurrency] = useState("ARS");
  const [usdRate, setUsdRate] = useState(1000);
  const [discountPct, setDiscountPct] = useState(0);
  const [transport, setTransport] = useState(0);
  const [installation, setInstallation] = useState(0);
  const [depositReceived, setDepositReceived] = useState(0);
  const [depositCurrency, setDepositCurrency] = useState("ARS");
  const [installments, setInstallments] = useState(1);
  const [poolId, setPoolId] = useState(0);
  const [poolPrice, setPoolPrice] = useState(0);
  const [poolCurrency, setPoolCurrency] = useState("ARS");
  const [observations, setObservations] = useState({ design: "", important: "", notes: "", fabrication: "" });
  const [snapshot, setSnapshot] = useState({ name: "", phone: "", email: "", address: "" });
  const [payment, setPayment] = useState({ payment_method: "", validity_days: 15, estimated_delivery: "", estimated_date: "" });
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.total, 0), [items]);
  const subtotalAdicionales = useMemo(() => adicionales.reduce((s, a) => s + a.total, 0), [adicionales]);
  const subtotalTotal = subtotal + subtotalAdicionales;
  const discountAmt = subtotalTotal * (discountPct / 100);
  const totalArs = subtotalTotal - discountAmt + transport + installation + poolPrice;
  const totalUsd = usdRate > 0 ? totalArs / usdRate : 0;
  const balanceDue = totalArs - depositReceived;

  const handleMaterialChange = (value: string) => {
    setSpecs({ ...specs, material: value });
    const material = materials.find((m) => m.name === value);
    if (material && material.base_price > 0) {
      setItems((prev) => {
        const next = [...prev];
        if (next.length > 0 && !next[0].description) {
          next[0] = { ...next[0], unit_price: material.base_price, total: next[0].quantity * material.base_price, price_m2: material.base_price };
        }
        return next;
      });
    }
  };

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
      api.getPoolStock().then(setPoolStock),
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
        setItems(b.items.map((i) => ({ _key: key(), description: i.description, quantity: i.quantity, unit_price: i.unit_price, total: i.total, length: i.length, width: i.width, m2: i.m2, price_m2: i.price_m2 })));
        setAdicionales((b.adicionales || []).map((a) => ({ _key: key(), concept: a.concept || "", detail: a.detail || "", quantity: a.quantity, unit_price: a.unit_price, total: a.total })));
        setCurrency(b.currency);
        setUsdRate(b.usd_rate);
        setDiscountPct(b.discount);
        setTransport(b.transport);
        setInstallation(b.installation);
        setDepositReceived(b.deposit_received);
        setDepositCurrency(b.deposit_currency);
        setInstallments(b.installments);
        setPoolId(b.pool_id || 0);
        setPoolPrice(b.pool_price);
        setPoolCurrency(b.pool_currency);
        setObservations({ design: b.design_observations || "", important: b.important_observations || "", notes: b.notes || "", fabrication: b.fabrication_details || "" });
        setSnapshot({ name: b.snapshot_name || "", phone: b.snapshot_phone || "", email: b.snapshot_email || "", address: b.snapshot_address || "" });
        setPayment({ payment_method: b.payment_method || "", validity_days: b.validity_days, estimated_delivery: b.estimated_delivery || "", estimated_date: b.estimated_date || "" });
      }).catch(() => notify("Error al cargar el presupuesto", "error"));
    }
    return () => { mounted.current = false; };
  }, [id, loadData, notify]);

  const updateItem = (idx: number, field: keyof Omit<ItemRow, "_key">, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "length" || field === "width") {
        const l = field === "length" ? Number(value) : next[idx].length;
        const w = field === "width" ? Number(value) : next[idx].width;
        next[idx].m2 = Number(((l * w) / 10000).toFixed(4));
        next[idx].price_m2 = next[idx].unit_price > 0 && next[idx].m2 > 0 ? Number((next[idx].unit_price / next[idx].m2).toFixed(2)) : 0;
      }
      if (field === "price_m2" && next[idx].m2 > 0) {
        next[idx].unit_price = Number((next[idx].m2 * Number(value)).toFixed(2));
      }
      if (field === "unit_price" && next[idx].m2 > 0) {
        next[idx].price_m2 = Number((Number(value) / next[idx].m2).toFixed(2));
      }
      if (field === "quantity" || field === "unit_price") {
        next[idx].total = Number((next[idx].quantity * next[idx].unit_price).toFixed(2));
      }
      return next;
    });
  };

  const addItem = () => setItems([...items, emptyItem()]);
  const removeItem = (idx: number) => items.length > 1 && setItems(items.filter((_, i) => i !== idx));

  const updateAdicional = (idx: number, field: keyof Omit<AdicionalRow, "_key">, value: string | number) => {
    setAdicionales((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "quantity" || field === "unit_price") {
        next[idx].total = Number((next[idx].quantity * next[idx].unit_price).toFixed(2));
      }
      return next;
    });
  };
  const addAdicional = () => setAdicionales([...adicionales, emptyAdicional()]);
  const removeAdicional = (idx: number) => setAdicionales(adicionales.filter((_, i) => i !== idx));

  const handlePoolChange = (id: number) => {
    setPoolId(id);
    const pool = poolStock.find((p) => p.id === id);
    if (pool) {
      setPoolPrice(pool.price);
      setPoolCurrency("ARS");
    } else {
      setPoolPrice(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) { notify("Seleccioná un cliente", "error"); return; }
    setSaving(true);
    const payload = {
      client_id: clientId,
      ...specs,
      currency, usd_rate: usdRate,
      subtotal_materials: subtotal,
      subtotal_services: subtotalAdicionales,
      subtotal: subtotalTotal,
      transport, installation,
      discount: discountPct,
      total: totalArs,
      total_usd: totalUsd,
      deposit_received: depositReceived,
      deposit_currency: depositCurrency,
      balance_due: balanceDue,
      payment_method: payment.payment_method,
      installments,
      validity_days: payment.validity_days,
      estimated_delivery: payment.estimated_delivery,
      estimated_date: payment.estimated_date,
      pool_id: poolId > 0 ? poolId : null,
      pool_price: poolPrice,
      pool_currency: poolCurrency,
      design_observations: observations.design,
      important_observations: observations.important,
      notes: observations.notes,
      fabrication_details: observations.fabrication,
      snapshot_name: snapshot.name,
      snapshot_phone: snapshot.phone,
      snapshot_email: snapshot.email,
      snapshot_address: snapshot.address,
      items: items.filter((i) => i.description).map(({ _key: _, ...i }) => i),
      adicionales: adicionales.filter((a) => a.concept || a.detail).map(({ _key: _, ...a }) => a),
    };
    try {
      if (isEdit) {
        await api.updateBudget(Number(id), payload);
      } else {
        await api.createBudget(payload);
      }
      navigate("/admin/budgets");
    } catch {
      notify("Error al guardar el presupuesto", "error");
    } finally {
      setSaving(false);
    }
  };

  if (dataError && !dataLoading) {
    return (
      <div className={styles.budgetForm}>
        <h2 className={styles.budgetForm__title}>{isEdit ? "Editar Presupuesto" : "Nuevo Presupuesto"}</h2>
        <ErrorBlock message={dataError} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className={styles.budgetForm}>
      <h2 className={styles.budgetForm__title}>{isEdit ? "Editar Presupuesto" : "Nuevo Presupuesto"}</h2>
      <form className={styles.budgetForm__form} onSubmit={handleSubmit}>
        {/* Cliente */}
        <fieldset className={styles.budgetForm__fieldset}>
          <legend>Cliente</legend>
          <select className={styles.budgetForm__input} value={clientId} onChange={(e) => setClientId(Number(e.target.value))} required disabled={dataLoading}>
            <option value={0}>{dataLoading ? "Cargando clientes..." : "Seleccionar cliente..."}</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </fieldset>

        {/* Especificaciones */}
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

        {/* Items */}
        <fieldset className={styles.budgetForm__fieldset}>
          <legend>Items</legend>
          <div className={styles.budgetForm__itemsHeader}>
            <span>Descripción</span><span>Largo</span><span>Ancho</span><span>M²</span><span>Cant.</span><span>$ / M²</span><span>P. Unit</span><span>Total</span><span></span>
          </div>
          {items.map((item, i) => (
            <div key={item._key} className={styles.budgetForm__itemRow}>
              <input className={styles.budgetForm__input} value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} placeholder="Descripción" />
              <input className={styles.budgetForm__input} type="number" value={item.length || ""} onChange={(e) => updateItem(i, "length", Number(e.target.value))} />
              <input className={styles.budgetForm__input} type="number" value={item.width || ""} onChange={(e) => updateItem(i, "width", Number(e.target.value))} />
              <span className={styles.budgetForm__itemTotal}>{item.m2.toFixed(4)}</span>
              <input className={styles.budgetForm__input} type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} />
              <input className={styles.budgetForm__input} type="number" value={item.price_m2 || ""} onChange={(e) => updateItem(i, "price_m2", Number(e.target.value))} />
              <input className={styles.budgetForm__input} type="number" value={item.unit_price} onChange={(e) => updateItem(i, "unit_price", Number(e.target.value))} />
              <span className={styles.budgetForm__itemTotal}>$ {item.total.toFixed(2)}</span>
              <button type="button" className={styles.budgetForm__removeItem} onClick={() => removeItem(i)}>✕</button>
            </div>
          ))}
          <button type="button" className={styles.budgetForm__addItem} onClick={addItem}>+ Agregar item</button>
        </fieldset>

        {/* Adicionales */}
        <fieldset className={styles.budgetForm__fieldset}>
          <legend>Adicionales</legend>
          <div className={styles.budgetForm__adicionalesHeader}>
            <span>Concepto</span><span>Detalle</span><span>Cant.</span><span>P. Unit</span><span>Total</span><span></span>
          </div>
          {adicionales.map((a, i) => (
            <div key={a._key} className={styles.budgetForm__adicionalRow}>
              <input className={styles.budgetForm__input} value={a.concept} onChange={(e) => updateAdicional(i, "concept", e.target.value)} placeholder="Concepto" />
              <input className={styles.budgetForm__input} value={a.detail} onChange={(e) => updateAdicional(i, "detail", e.target.value)} placeholder="Detalle" />
              <input className={styles.budgetForm__input} type="number" value={a.quantity} onChange={(e) => updateAdicional(i, "quantity", Number(e.target.value))} />
              <input className={styles.budgetForm__input} type="number" value={a.unit_price} onChange={(e) => updateAdicional(i, "unit_price", Number(e.target.value))} />
              <span className={styles.budgetForm__itemTotal}>$ {a.total.toFixed(2)}</span>
              <button type="button" className={styles.budgetForm__removeItem} onClick={() => removeAdicional(i)}>✕</button>
            </div>
          ))}
          <button type="button" className={styles.budgetForm__addItem} onClick={addAdicional}>+ Agregar adicional</button>
        </fieldset>

        {/* Pool / Pileta */}
        <fieldset className={styles.budgetForm__fieldset}>
          <legend>Pool / Pileta</legend>
          <div className={styles.budgetForm__grid2}>
            <label className={styles.budgetForm__label}>Pool
              <select className={styles.budgetForm__input} value={poolId} onChange={(e) => handlePoolChange(Number(e.target.value))}>
                <option value={0}>Sin pool</option>
                {poolStock.map((p) => (
                  <option key={p.id} value={p.id}>{p.brand} {p.model} (${p.price})</option>
                ))}
              </select>
            </label>
            <label className={styles.budgetForm__label}>Precio pool
              <input className={styles.budgetForm__input} type="number" value={poolPrice} onChange={(e) => setPoolPrice(Number(e.target.value))} />
            </label>
            <label className={styles.budgetForm__label}>Moneda pool
              <select className={styles.budgetForm__input} value={poolCurrency} onChange={(e) => setPoolCurrency(e.target.value)}>
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </label>
          </div>
        </fieldset>

        {/* Financiero */}
        <fieldset className={styles.budgetForm__fieldset}>
          <legend>Financiero</legend>
          <div className={styles.budgetForm__grid2}>
            <label className={styles.budgetForm__label}>Moneda
              <select className={styles.budgetForm__input} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </label>
            <label className={styles.budgetForm__label}>Cotización USD
              <input className={styles.budgetForm__input} type="number" value={usdRate} onChange={(e) => setUsdRate(Number(e.target.value))} />
            </label>
            <label className={styles.budgetForm__label}>Descuento %
              <input className={styles.budgetForm__input} type="number" value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value))} min="0" max="100" />
            </label>
            <label className={styles.budgetForm__label}>Transporte
              <input className={styles.budgetForm__input} type="number" value={transport} onChange={(e) => setTransport(Number(e.target.value))} />
            </label>
            <label className={styles.budgetForm__label}>Instalación
              <input className={styles.budgetForm__input} type="number" value={installation} onChange={(e) => setInstallation(Number(e.target.value))} />
            </label>
            <label className={styles.budgetForm__label}>Seña recibida
              <input className={styles.budgetForm__input} type="number" value={depositReceived} onChange={(e) => setDepositReceived(Number(e.target.value))} />
            </label>
            <label className={styles.budgetForm__label}>Moneda seña
              <select className={styles.budgetForm__input} value={depositCurrency} onChange={(e) => setDepositCurrency(e.target.value)}>
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </label>
            <label className={styles.budgetForm__label}>Cuotas
              <input className={styles.budgetForm__input} type="number" value={installments} onChange={(e) => setInstallments(Number(e.target.value))} min="1" />
            </label>
          </div>
          <div className={styles.budgetForm__totals}>
            <span>Subtotal: $ {subtotalTotal.toFixed(2)}</span>
            {discountPct > 0 && <span>Desc.: -$ {discountAmt.toFixed(2)}</span>}
            <span>Total: $ {totalArs.toFixed(2)}</span>
            {currency === "ARS" && <span>USD: US$ {totalUsd.toFixed(2)}</span>}
            <span>Saldo: $ {balanceDue.toFixed(2)}</span>
          </div>
        </fieldset>

        {/* Comercial */}
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
            <label className={styles.budgetForm__label}>Entrega aprox.<input className={styles.budgetForm__input} value={payment.estimated_delivery} onChange={(e) => setPayment({ ...payment, estimated_delivery: e.target.value })} /></label>
            <label className={styles.budgetForm__label}>Fecha estimada<input className={styles.budgetForm__input} type="date" value={payment.estimated_date} onChange={(e) => setPayment({ ...payment, estimated_date: e.target.value })} /></label>
          </div>
        </fieldset>

        {/* Observaciones */}
        <fieldset className={styles.budgetForm__fieldset}>
          <legend>Observaciones</legend>
          <div className={styles.budgetForm__grid2}>
            <label className={styles.budgetForm__label}>Diseño
              <textarea className={styles.budgetForm__textarea} value={observations.design} onChange={(e) => setObservations({ ...observations, design: e.target.value })} />
            </label>
            <label className={styles.budgetForm__label}>Importantes
              <textarea className={styles.budgetForm__textarea} value={observations.important} onChange={(e) => setObservations({ ...observations, important: e.target.value })} />
            </label>
            <label className={styles.budgetForm__label}>Fabricación
              <textarea className={styles.budgetForm__textarea} value={observations.fabrication} onChange={(e) => setObservations({ ...observations, fabrication: e.target.value })} />
            </label>
            <label className={styles.budgetForm__label}>Generales
              <textarea className={styles.budgetForm__textarea} value={observations.notes} onChange={(e) => setObservations({ ...observations, notes: e.target.value })} />
            </label>
          </div>
        </fieldset>

        {/* Snapshot cliente */}
        <fieldset className={styles.budgetForm__fieldset}>
          <legend>Datos del cliente (snapshot)</legend>
          <div className={styles.budgetForm__grid2}>
            <label className={styles.budgetForm__label}>Nombre
              <input className={styles.budgetForm__input} value={snapshot.name} onChange={(e) => setSnapshot({ ...snapshot, name: e.target.value })} />
            </label>
            <label className={styles.budgetForm__label}>Teléfono
              <input className={styles.budgetForm__input} value={snapshot.phone} onChange={(e) => setSnapshot({ ...snapshot, phone: e.target.value })} />
            </label>
            <label className={styles.budgetForm__label}>Email
              <input className={styles.budgetForm__input} value={snapshot.email} onChange={(e) => setSnapshot({ ...snapshot, email: e.target.value })} />
            </label>
            <label className={styles.budgetForm__label}>Dirección
              <input className={styles.budgetForm__input} value={snapshot.address} onChange={(e) => setSnapshot({ ...snapshot, address: e.target.value })} />
            </label>
          </div>
        </fieldset>

        <FormActions loading={saving || dataLoading} />
      </form>
    </div>
  );
}
