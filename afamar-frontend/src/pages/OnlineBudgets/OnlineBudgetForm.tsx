import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useNotify } from "../../context/NotificationContext";
import { ErrorBlock } from "../../components/ui/ErrorBlock";
import type { Material, PoolStock, OnlineBudget } from "../../types";
import { ObFormHeader } from "./ObFormHeader";
import { ObFormTotals } from "./ObFormTotals";
import styles from "./OnlineBudgets.module.css";

interface ItemRow {
  _key: number; detalle: string; largo: number; ancho: number; m2: number;
  cantidad: number; moneda: "ARS" | "USD"; precio_unitario: number; subtotal: number; es_unidad: boolean;
}

interface SpecialItemRow extends ItemRow {
  material: string; pileta_id: number | null; mano_de_obra: number;
}

const TIPOS_ESPECIALES = [
  { detalle: "ZOCALOS", es_unidad: false },
  { detalle: "APERTURA + PEGADO PILETA", es_unidad: true },
  { detalle: "APERTURA PILETA APOYO", es_unidad: true },
  { detalle: "MENSULAS", es_unidad: true },
  { detalle: "APERTURA ANAFE", es_unidad: true },
  { detalle: "TERMINACION", es_unidad: true },
  { detalle: "PILETA MOD", es_unidad: true },
];

const NOMBRES_ESPECIALES = new Set(TIPOS_ESPECIALES.map((t) => t.detalle));

let _nextKey = 1;
const key = () => _nextKey++;

function emptyItem(detalle = "LONGITUD", es_unidad = false): ItemRow {
  return { _key: key(), detalle, largo: 0, ancho: 0, m2: 0, cantidad: 1, moneda: "ARS", precio_unitario: 0, subtotal: 0, es_unidad };
}

function emptySpecial(detalle: string, es_unidad: boolean): SpecialItemRow {
  return { ...emptyItem(detalle, es_unidad), material: "", pileta_id: null, mano_de_obra: 0 };
}

export function OnlineBudgetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useNotify();
  const isEdit = Boolean(id);
  const mounted = useRef(true);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [poolStock, setPoolStock] = useState<PoolStock[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [clientName, setClientName] = useState("");
  const [workType, setWorkType] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [usdRate, setUsdRate] = useState(1000);
  const [phone, setPhone] = useState("");

  const [items, setItems] = useState<ItemRow[]>([emptyItem("LONGITUD", false)]);
  const [especiales, setEspeciales] = useState<SpecialItemRow[]>([emptySpecial("ZOCALOS", false)]);
  const [nuevoEspecial, setNuevoEspecial] = useState("");
  const [matEspeciales, setMatEspeciales] = useState<Record<number, string>>({});
  const [convertedNumber, setConvertedNumber] = useState("");

  const allItems = [...items, ...especiales];
  const totalArs = allItems.reduce((s, i) => (i.moneda === "ARS" ? s + i.subtotal : s), 0);
  const totalUsd = allItems.reduce((s, i) => (i.moneda === "USD" ? s + i.subtotal : s), 0);
  const totalConsolidado = totalArs + totalUsd * usdRate;
  const hayUSD = allItems.some((i) => i.moneda === "USD");

  const handleDetalleChange = (idx: number, value: string, isEspecial: boolean) => {
    const mat = materials.find((m) => m.name === value);
    const list = isEspecial ? [...especiales] : [...items];
    if (mat) {
      if (!isEspecial) {
        list[idx] = { ...list[idx], detalle: value, moneda: (mat.currency as "ARS" | "USD") || "ARS", precio_unitario: mat.currency === "USD" ? mat.price_usd : mat.base_price } as ItemRow;
      } else {
        const s = list[idx] as SpecialItemRow;
        s.material = value;
        s.moneda = (mat.currency as "ARS" | "USD") || "ARS";
        s.precio_unitario = mat.currency === "USD" ? mat.price_usd : mat.base_price;
      }
      calcRow(list[idx]);
    } else if (!isEspecial) {
      list[idx] = { ...list[idx], detalle: "LONGITUD", moneda: "ARS", precio_unitario: 0 } as ItemRow;
    }
    if (isEspecial) {
      setEspeciales(list as SpecialItemRow[]);
      mat && setMatEspeciales({ ...matEspeciales, [idx]: value });
    } else {
      setItems(list as ItemRow[]);
    }
  };

  const updateItem = (idx: number, field: string, val: string | number, isEspecial: boolean) => {
    const list = isEspecial ? ([...especiales] as (ItemRow | SpecialItemRow)[]) : [...items];
    const numVal = field === "detalle" || field === "moneda" || field === "material" ? val : Number(val) || 0;
    (list[idx] as any)[field] = numVal;

    if (field === "largo" || field === "ancho" || field === "mano_de_obra") {
      const item = list[idx];
      const la = Number(item.largo) || 0;
      const an = Number(item.ancho) || 0;
      if (item.detalle === "TERMINACION") {
        const mo = Number((item as SpecialItemRow).mano_de_obra) || 0;
        item.subtotal = Math.round(la * mo * 100) / 100;
        item.precio_unitario = Math.round(la * mo * 100) / 100;
      } else if (!item.es_unidad) {
        item.m2 = Math.round(la * an * 100000) / 100000;
      }
    }

    calcRow(list[idx]);
    if (isEspecial) setEspeciales(list as SpecialItemRow[]);
    else setItems(list as ItemRow[]);
  };

  const calcRow = (item: ItemRow | SpecialItemRow) => {
    const m2 = item.m2 || 0;
    const cant = Number(item.cantidad) || 1;
    const pu = Number(item.precio_unitario) || 0;
    if (item.detalle === "TERMINACION") {
    } else if (item.es_unidad) {
      item.subtotal = Math.round(cant * pu * 100) / 100;
    } else if (m2 > 0 && pu > 0) {
      item.subtotal = Math.round(m2 * cant * pu * 100) / 100;
    } else {
      item.subtotal = Math.round(cant * pu * 100) / 100;
    }
  };

  const addItem = () => setItems([...items, emptyItem("LONGITUD", false)]);
  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const addEspecial = () => {
    if (!nuevoEspecial) return;
    const tipo = TIPOS_ESPECIALES.find((t) => t.detalle === nuevoEspecial);
    if (!tipo) return;
    setEspeciales([...especiales, emptySpecial(tipo.detalle, tipo.es_unidad)]);
    setNuevoEspecial("");
  };

  const removeEspecial = (idx: number) => {
    if (especiales.length <= 1 && especiales[0].detalle === "ZOCALOS") return;
    setEspeciales(especiales.filter((_, i) => i !== idx));
  };

  const handlePiletaChange = (idx: number, pid: string) => {
    const list = [...especiales];
    const pool = poolStock.find((x) => x.id === Number(pid));
    const precio = pool ? (pool.price || 0) : 0;
    const s = list[idx] as SpecialItemRow;
    s.pileta_id = Number(pid);
    s.moneda = "ARS";
    s.precio_unitario = precio;
    s.subtotal = Math.round((Number(s.cantidad) || 1) * precio * 100) / 100;
    setEspeciales(list);
  };

  const generarWhatsApp = () => {
    const L: string[] = [];
    L.push("AFAMAR - MARMOLES & GRANITOS");
    L.push("LA PLATA, BS AS");
    if (clientName) L.push(`Cliente: ${clientName}`);
    if (workType) L.push(`Obra: ${workType}`);
    if (date) L.push(`Fecha: ${date}`);
    L.push("");

    const itemsUsd = allItems.filter((i) => i.subtotal > 0 && i.moneda === "USD");
    const itemsArs = allItems.filter((i) => i.subtotal > 0 && i.moneda === "ARS");

    if (itemsUsd.length) {
      L.push("Cotizado en DOLARES (USD):");
      itemsUsd.forEach((i) => {
        let t = `. ${i.detalle}`;
        if (i.es_unidad) t += ` | Cant: ${i.cantidad}`;
        else if (i.m2 > 0) t += ` | ${i.largo}x${i.ancho} = ${i.m2.toFixed(5)} m2`;
        t += ` | USD ${i.precio_unitario.toFixed(2)}/u = USD ${i.subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
        L.push(t);
      });
      L.push("");
    }
    if (itemsArs.length) {
      L.push("Cotizado en PESOS (ARS):");
      itemsArs.forEach((i) => {
        let t = `. ${i.detalle}`;
        if (i.es_unidad) t += ` | Cant: ${i.cantidad}`;
        else if (i.m2 > 0) t += ` | ${i.largo}x${i.ancho} = ${i.m2.toFixed(5)} m2`;
        t += ` | $ ${i.precio_unitario.toFixed(2)}/u = $ ${i.subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
        L.push(t);
      });
      L.push("");
    }
    L.push("==============================");
    if (totalUsd > 0) L.push(`TOTAL USD: USD ${totalUsd.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
    if (totalArs > 0) L.push(`TOTAL ARS: $ ${totalArs.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
    if (totalUsd > 0 && usdRate > 0) {
      L.push(`Dolar del dia: $${usdRate.toLocaleString("es-AR")}`);
      L.push(`TOTAL CONSOLIDADO: $ ${totalConsolidado.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
    }
    L.push("");
    L.push("Consultas al WhatsApp");
    return L.join("\n");
  };

  const loadData = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const [mat, ps] = await Promise.all([api.getMaterials(), api.getPoolStock()]);
      if (!mounted.current) return;
      setMaterials(mat);
      setPoolStock(ps);
    } catch {
      if (mounted.current) setDataError("Error al cargar datos del formulario");
    } finally {
      if (mounted.current) setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    loadData();
    if (id) {
      api.getOnlineBudget(Number(id)).then((ob: OnlineBudget) => {
        if (!mounted.current) return;
        setClientName(ob.client_name || "");
        setWorkType(ob.work_type || "");
        setDate(ob.date || new Date().toISOString().slice(0, 10));
        setUsdRate(ob.usd_rate);
        setConvertedNumber(ob.number);

        let parsedItems: any[] = [];
        try { if (ob.items_data) parsedItems = JSON.parse(ob.items_data); } catch { parsedItems = []; }

        const phoneVal = parsedItems.find((i: any) => i._meta?.phone)?.phone || "";
        if (phoneVal) setPhone(phoneVal);

        const meta = parsedItems.find((i: any) => i && i._meta);
        if (meta) {
          setPhone(meta._meta.phone || "");
          parsedItems = parsedItems.filter((i: any) => !i._meta);
        }

        const normales = parsedItems.filter((i: any) => !i.es_unidad && !NOMBRES_ESPECIALES.has(i.detalle)).map((i: any) => ({
          ...emptyItem("LONGITUD", false), detalle: i.detalle || "LONGITUD", largo: Number(i.largo) || 0, ancho: Number(i.ancho) || 0, m2: Number(i.m2) || 0, cantidad: Math.max(1, Number(i.cantidad) || 1), moneda: i.moneda || "ARS", precio_unitario: Number(i.precio_unitario) || 0, subtotal: Number(i.subtotal) || 0
        }));
        const esp = parsedItems.filter((i: any) => i.es_unidad || NOMBRES_ESPECIALES.has(i.detalle)).map((i: any) => {
          const e = emptySpecial(i.detalle || "ZOCALOS", i.es_unidad || false);
          e.largo = Number(i.largo) || 0; e.ancho = Number(i.ancho) || 0; e.m2 = Number(i.m2) || 0;
          e.cantidad = Math.max(1, Number(i.cantidad) || 1); e.moneda = i.moneda || "ARS";
          e.precio_unitario = Number(i.precio_unitario) || 0; e.subtotal = Number(i.subtotal) || 0;
          e.material = i.material || ""; e.pileta_id = i.pileta_id || (ob.pool_id || null); e.mano_de_obra = Number(i.mano_de_obra) || 0;
          return e;
        });

        setItems(normales.length ? normales : [emptyItem("LONGITUD", false)]);
        setEspeciales(esp.length ? esp : [emptySpecial("ZOCALOS", false)]);

        const matEsp: Record<number, string> = {};
        esp.forEach((e: SpecialItemRow, i: number) => { if (e.material) matEsp[i] = e.material; });
        setMatEspeciales(matEsp);
      }).catch(() => notify("Error al cargar presupuesto online", "error"));
    }
    return () => { mounted.current = false; };
  }, [id, loadData, notify]);

  const buildPayload = () => {
    const allItems = [...items, ...especiales];
    const metaItem = { _meta: { phone } };
    const itemsForJson = allItems.map((i) => {
      const base: any = {
        detalle: i.detalle, largo: i.largo, ancho: i.ancho, m2: i.m2,
        cantidad: i.cantidad, moneda: i.moneda, precio_unitario: i.precio_unitario,
        subtotal: i.subtotal, es_unidad: i.es_unidad,
      };
      if ((i as SpecialItemRow).material) base.material = (i as SpecialItemRow).material;
      if ((i as SpecialItemRow).pileta_id) base.pileta_id = (i as SpecialItemRow).pileta_id;
      if ((i as SpecialItemRow).mano_de_obra) base.mano_de_obra = (i as SpecialItemRow).mano_de_obra;
      return base;
    });
    const piletaItems = especiales.filter((e) => e.detalle === "PILETA MOD" && e.pileta_id);
    return {
      client_name: clientName, work_type: workType, date, usd_rate: usdRate,
      items_data: JSON.stringify([...itemsForJson, metaItem]),
      total_net_ars: Math.round(totalArs * 100) / 100,
      total_net_usd: Math.round(totalUsd * 100) / 100,
      total_consolidated: Math.round(totalConsolidado * 100) / 100,
      pool_id: piletaItems.length ? Number(piletaItems[0].pileta_id) : null,
      pool_price: piletaItems.length ? (Number(piletaItems[0].precio_unitario) || 0) : 0,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName) { notify("Ingrese el nombre del cliente", "error"); return; }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        await api.updateOnlineBudget(Number(id), payload);
        notify("Presupuesto online actualizado", "success");
      } else {
        await api.createOnlineBudget(payload);
        notify("Presupuesto online creado", "success");
      }
      navigate("/admin/online-budgets");
    } catch {
      notify("Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsAppExport = async () => {
    try {
      await navigator.clipboard.writeText(generarWhatsApp());
      notify("Copiado al portapapeles", "success");
    } catch { notify("Error al copiar", "error"); }
  };

  const handleConvertToWorkOrder = async () => {
    if (!id) return;
    try {
      const wo = await api.convertOnlineBudgetToWorkOrder(Number(id));
      notify(`Orden ${wo.number} creada`, "success");
      navigate("/admin/work-orders");
    } catch (err: any) {
      notify(err.message || "Error al convertir", "error");
    }
  };

  if (dataError && !dataLoading) {
    return (
      <div className={styles.onlineBudgets}>
        <h2 className={styles.onlineBudgets__title}>{isEdit ? "Editar Presupuesto Online" : "Nuevo Presupuesto Online"}</h2>
        <ErrorBlock message={dataError} onRetry={loadData} />
      </div>
    );
  }

  const inputStyle = { padding: "4px 6px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 12, textAlign: "right" as const, boxSizing: "border-box" as const, width: "100%" };
  const inputTextStyle = { ...inputStyle, textAlign: "left" as const };
  const selectStyle = { ...inputStyle, textAlign: "center" as const, cursor: "pointer" as const };
  const cellStyle = { padding: "3px 4px" };

  return (
    <div className={styles.onlineBudgets}>
      <h2 className={styles.onlineBudgets__title}>
        {isEdit ? `Editar Presupuesto ${convertedNumber}` : "Nuevo Presupuesto Online"}
      </h2>
      <form className={styles.onlineBudgets__form} onSubmit={handleSubmit}>
        <ObFormHeader
          clientName={clientName} phone={phone} workType={workType}
          date={date} usdRate={usdRate} dataLoading={dataLoading}
          onClientNameChange={setClientName} onPhoneChange={setPhone}
          onWorkTypeChange={setWorkType} onDateChange={setDate}
          onUsdRateChange={setUsdRate}
        />

        {/* PRODUCCION ESTANDAR */}
        <fieldset className={styles.onlineBudgets__fieldset}>
          <legend className={styles["onlineBudgets__legend--blue"]}>PRODUCCION ESTANDAR</legend>
          <div style={{ overflowX: "auto" }}>
            <table className={styles.onlineBudgets__gridTable}>
              <thead>
                <tr>
                  <th style={{ ...cellStyle, textAlign: "left", width: "16%" }}>Sector / Modelo</th>
                  <th style={{ ...cellStyle, textAlign: "center", width: "8%" }}>Largo</th>
                  <th style={{ ...cellStyle, textAlign: "center", width: "8%" }}>Ancho</th>
                  <th style={{ ...cellStyle, textAlign: "center", width: "8%" }}>M2/U</th>
                  <th style={{ ...cellStyle, textAlign: "center", width: "7%" }}>Cant.</th>
                  <th style={{ ...cellStyle, textAlign: "center", width: "7%" }}>Moneda</th>
                  <th style={{ ...cellStyle, textAlign: "right", width: "12%" }}>Precio Unit.</th>
                  <th style={{ ...cellStyle, textAlign: "right", width: "12%" }}>Subtotal</th>
                  <th style={{ width: 26 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item._key}>
                    <td style={cellStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" }}>LONGITUD :</span>
                        <select style={{ ...inputTextStyle, flex: 1, minWidth: 80 }} value={item.detalle}
                          onChange={(e) => handleDetalleChange(idx, e.target.value, false)} disabled={dataLoading}>
                          <option value="">-- sin material --</option>
                          {materials.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                        </select>
                      </div>
                    </td>
                    <td style={cellStyle}><input type="number" step="any" style={inputStyle} value={item.largo || ""} onChange={(e) => updateItem(idx, "largo", e.target.value, false)} disabled={dataLoading} /></td>
                    <td style={cellStyle}><input type="number" step="any" style={inputStyle} value={item.ancho || ""} onChange={(e) => updateItem(idx, "ancho", e.target.value, false)} disabled={dataLoading} /></td>
                    <td style={{ ...cellStyle, textAlign: "center", fontWeight: 600 }}>{item.m2 > 0 ? item.m2.toFixed(5) : "-"}</td>
                    <td style={cellStyle}><input type="number" style={inputStyle} value={item.cantidad} onChange={(e) => updateItem(idx, "cantidad", e.target.value, false)} min="1" disabled={dataLoading} /></td>
                    <td style={cellStyle}>
                      <select style={selectStyle} value={item.moneda} onChange={(e) => updateItem(idx, "moneda", e.target.value, false)} disabled={dataLoading || item.detalle !== "LONGITUD"}>
                        <option value="ARS">ARS</option>
                        <option value="USD">USD</option>
                      </select>
                    </td>
                    <td style={cellStyle}><input type="number" step="any" style={inputStyle} value={item.precio_unitario || ""} onChange={(e) => updateItem(idx, "precio_unitario", e.target.value, false)} disabled={dataLoading} /></td>
                    <td style={{ ...cellStyle, textAlign: "right", fontWeight: 600, color: item.moneda === "USD" ? "#059669" : "#1e293b" }}>
                      {item.moneda === "USD" ? "USD " : "$ "}{(item.subtotal || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={cellStyle}>
                      <button type="button" onClick={() => removeItem(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 2 }} title="Eliminar" disabled={dataLoading}>✕</button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={9} style={{ padding: "4px 0", textAlign: "center" }}>
                    <button type="button" onClick={addItem} className={styles.onlineBudgets__addRowBtn} disabled={dataLoading}>+ Agregar otra longitud</button>
                  </td>
                </tr>

                {/* CORTES Y ACCESORIOS */}
                <tr style={{ background: "#fef3c7" }}>
                  <td colSpan={9} style={{ ...cellStyle, fontWeight: 700, fontSize: 12, color: "#92400e" }}>CORTES Y ACCESORIOS</td>
                </tr>
                {especiales.map((item, idx) => (
                  <tr key={item._key}>
                    <td style={cellStyle}>
                      {item.detalle === "PILETA MOD" ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" }}>PILETA MOD :</span>
                          <select style={{ ...inputTextStyle, flex: 1, minWidth: 80, fontSize: 11 }} value={item.pileta_id || ""}
                            onChange={(e) => handlePiletaChange(idx, e.target.value)} disabled={dataLoading}>
                            <option value="">Seleccionar...</option>
                            {poolStock.map((p) => (<option key={p.id} value={p.id}>{p.brand} - {p.model} (Stock: {p.quantity})</option>))}
                          </select>
                        </div>
                      ) : item.detalle === "TERMINACION" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{ fontWeight: 700, fontSize: 11 }}>TERMINACION</span>
                          <input style={{ ...inputTextStyle, fontSize: 11 }} placeholder="Tipo de terminacion..." disabled={dataLoading} />
                        </div>
                      ) : item.es_unidad ? (
                        <span style={{ fontWeight: 700, fontSize: 12 }}>{item.detalle}</span>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" }}>{item.detalle} :</span>
                          <select style={{ ...inputTextStyle, flex: 1, minWidth: 80 }} value={matEspeciales[idx] || ""}
                            onChange={(e) => handleDetalleChange(idx, e.target.value, true)} disabled={dataLoading}>
                            <option value="">-- sin material --</option>
                            {materials.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                          </select>
                        </div>
                      )}
                    </td>
                    <td style={cellStyle}>
                      {item.detalle === "TERMINACION" ? (
                        <input type="number" step="any" style={inputStyle} value={item.largo || ""} onChange={(e) => updateItem(idx, "largo", e.target.value, true)} placeholder="Mts lineales" disabled={dataLoading} />
                      ) : !item.es_unidad && (<input type="number" step="any" style={inputStyle} value={item.largo || ""} onChange={(e) => updateItem(idx, "largo", e.target.value, true)} disabled={dataLoading} />)}
                    </td>
                    <td style={cellStyle}>
                      {item.detalle === "TERMINACION" ? (
                        <input type="number" step="any" style={inputStyle} value={item.mano_de_obra || ""} onChange={(e) => updateItem(idx, "mano_de_obra", e.target.value, true)} placeholder="Mano de obra" disabled={dataLoading} />
                      ) : !item.es_unidad ? (<input type="number" step="any" style={inputStyle} value={item.ancho || ""} onChange={(e) => updateItem(idx, "ancho", e.target.value, true)} disabled={dataLoading} />) : null}
                    </td>
                    <td style={{ ...cellStyle, textAlign: "center", fontWeight: 600, color: item.es_unidad ? "#b91c1c" : "#1e293b" }}>
                      {item.detalle === "TERMINACION" ? "$" + (item.precio_unitario || 0).toLocaleString("es-AR") : item.es_unidad ? "U" : (item.m2 > 0 ? item.m2.toFixed(5) : "-")}
                    </td>
                    <td style={cellStyle}><input type="number" style={inputStyle} value={item.cantidad} onChange={(e) => updateItem(idx, "cantidad", e.target.value, true)} min="1" disabled={dataLoading} /></td>
                    <td style={cellStyle}>
                      <select style={selectStyle} value={item.moneda}
                        onChange={(e) => {
                          const nuevoMoneda = e.target.value;
                          const list = [...especiales];
                          list[idx] = { ...list[idx], moneda: nuevoMoneda } as SpecialItemRow;
                          if (item.detalle === "PILETA MOD" && item.pileta_id) {
                            const p = poolStock.find((x) => x.id === Number(item.pileta_id));
                            if (p) {
                              const nuevoPrecio = nuevoMoneda === "USD" ? (p.price_usd || 0) : (p.price || 0);
                              list[idx].precio_unitario = nuevoPrecio;
                              list[idx].subtotal = Math.round((Number(list[idx].cantidad) || 1) * nuevoPrecio * 100) / 100;
                            }
                          }
                          setEspeciales(list);
                        }}
                        disabled={dataLoading || !!matEspeciales[idx]}>
                        <option value="ARS">ARS</option>
                        <option value="USD">USD</option>
                      </select>
                    </td>
                    <td style={cellStyle}><input type="number" step="any" style={inputStyle} value={item.precio_unitario || ""} onChange={(e) => updateItem(idx, "precio_unitario", e.target.value, true)} disabled={dataLoading} /></td>
                    <td style={{ ...cellStyle, textAlign: "right", fontWeight: 600, color: item.moneda === "USD" ? "#059669" : "#1e293b" }}>
                      {item.moneda === "USD" ? "USD " : "$ "}{(item.subtotal || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={cellStyle}>
                      <button type="button" onClick={() => removeEspecial(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 2 }} title="Eliminar" disabled={dataLoading}>✕</button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={9} style={{ padding: "4px 0" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
                      <select style={{ padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 11, width: 200 }} value={nuevoEspecial} onChange={(e) => setNuevoEspecial(e.target.value)} disabled={dataLoading}>
                        <option value="">-- Agregar corte o accesorio --</option>
                        {TIPOS_ESPECIALES.map((t) => <option key={t.detalle} value={t.detalle}>{t.detalle}</option>)}
                      </select>
                      <button type="button" onClick={addEspecial} className={styles.onlineBudgets__addRowBtn} disabled={dataLoading}>+ Agregar</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </fieldset>

        <ObFormTotals
          totalArs={totalArs} totalUsd={totalUsd} totalConsolidado={totalConsolidado}
          usdRate={usdRate} hayUSD={hayUSD}
          isEdit={isEdit} dataLoading={dataLoading} saving={saving}
          onWhatsAppExport={handleWhatsAppExport}
          onConvertToWorkOrder={handleConvertToWorkOrder}
        />
      </form>
    </div>
  );
}
