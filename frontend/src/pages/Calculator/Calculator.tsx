import { useState } from "react";
import { PlateCalculator } from "./PlateCalculator";
import styles from "./Calculator.module.css";

interface CalcItem {
  id: number;
  description: string;
  length: number;
  width: number;
  quantity: number;
  price_m2: number;
  unit_price: number;
  total: number;
}

let nextId = 1;

function calcM2(length: number, width: number, unit: "cm" | "m"): number {
  const divisor = unit === "cm" ? 10000 : 1;
  return Number(((length * width) / divisor).toFixed(4));
}

function emptyItem(): CalcItem {
  return { id: nextId++, description: "", length: 0, width: 0, quantity: 1, price_m2: 0, unit_price: 0, total: 0 };
}

export function Calculator() {
  const [tab, setTab] = useState<"budget" | "plate">("budget");
  const [items, setItems] = useState<CalcItem[]>([emptyItem()]);
  const [unit, setUnit] = useState<"cm" | "m">("cm");
  const [usdRate, setUsdRate] = useState(1000);
  const [discountPct, setDiscountPct] = useState(0);
  const [transport, setTransport] = useState(0);
  const [installation, setInstallation] = useState(0);

  const updateItem = (id: number, field: keyof CalcItem, value: number | string) => {
    setItems((prev) => {
      const next = prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        const m2 = calcM2(
          field === "length" ? Number(value) : updated.length,
          field === "width" ? Number(value) : updated.width,
          unit,
        );
        updated.unit_price = Number((m2 * updated.price_m2).toFixed(2));
        if (field === "quantity" || field === "price_m2") {
          updated.unit_price = Number((m2 * updated.price_m2).toFixed(2));
        }
        updated.total = Number((updated.unit_price * updated.quantity).toFixed(2));
        const finalM2 = field === "length" || field === "width" || field === "price_m2"
          ? calcM2(updated.length, updated.width, unit) : m2;
        if (field !== "quantity") {
          updated.unit_price = Number((finalM2 * updated.price_m2).toFixed(2));
          updated.total = Number((updated.unit_price * updated.quantity).toFixed(2));
        }
        return updated;
      });
      return next;
    });
  };

  const addItem = () => setItems([...items, emptyItem()]);
  const removeItem = (id: number) => items.length > 1 && setItems(items.filter((i) => i.id !== id));

  const subtotalArs = items.reduce((s, i) => s + i.total, 0);
  const discountAmt = subtotalArs * (discountPct / 100);
  const totalArs = subtotalArs - discountAmt + transport + installation;
  const totalUsd = usdRate > 0 ? totalArs / usdRate : 0;

  return (
    <div className={styles.calculator}>
      <div className={styles.calculator__tabs}>
        <button
          className={`${styles.calculator__tab} ${tab === "budget" ? styles["calculator__tab--active"] : ""}`}
          onClick={() => setTab("budget")}
        >
          Presupuesto
        </button>
        <button
          className={`${styles.calculator__tab} ${tab === "plate" ? styles["calculator__tab--active"] : ""}`}
          onClick={() => setTab("plate")}
        >
          Placas
        </button>
      </div>

      {tab === "plate" ? (
        <PlateCalculator />
      ) : (
        <>
          <h2 className={styles.calculator__title}>Calculadora de Presupuesto</h2>
          <div className={styles.calculator__toolbar}>
            <label className={styles.calculator__label}>
              Unidad
              <select className={styles.calculator__input} value={unit} onChange={(e) => setUnit(e.target.value as "cm" | "m")}>
                <option value="cm">Centímetros (cm)</option>
                <option value="m">Metros (m)</option>
              </select>
            </label>
            <label className={styles.calculator__label}>
              USD Rate
              <input className={styles.calculator__input} type="number" value={usdRate} onChange={(e) => setUsdRate(Number(e.target.value))} />
            </label>
            <label className={styles.calculator__label}>
              Descuento %
              <input className={styles.calculator__input} type="number" value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value))} min="0" max="100" />
            </label>
            <label className={styles.calculator__label}>
              Transporte
              <input className={styles.calculator__input} type="number" value={transport} onChange={(e) => setTransport(Number(e.target.value))} />
            </label>
            <label className={styles.calculator__label}>
              Instalación
              <input className={styles.calculator__input} type="number" value={installation} onChange={(e) => setInstallation(Number(e.target.value))} />
            </label>
          </div>

          <div className={styles.calculator__table}>
            <div className={styles.calculator__thRow}>
              <span>Descripción</span><span>Largo ({unit})</span><span>Ancho ({unit})</span>
              <span>M²</span><span>Cant.</span><span>$ / M²</span><span>P. Unit</span><span>Total</span><span></span>
            </div>
            {items.map((item) => {
              const m2Val = calcM2(item.length, item.width, unit);
              return (
                <div key={item.id} className={styles.calculator__tdRow}>
                  <input className={styles.calculator__input} value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} placeholder="Desc" />
                  <input className={styles.calculator__input} type="number" value={item.length || ""} onChange={(e) => updateItem(item.id, "length", Number(e.target.value))} />
                  <input className={styles.calculator__input} type="number" value={item.width || ""} onChange={(e) => updateItem(item.id, "width", Number(e.target.value))} />
                  <span className={styles.calculator__m2}>{m2Val.toFixed(4)}</span>
                  <input className={styles.calculator__input} type="number" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))} />
                  <input className={styles.calculator__input} type="number" value={item.price_m2 || ""} onChange={(e) => updateItem(item.id, "price_m2", Number(e.target.value))} />
                  <span className={styles.calculator__num}>$ {item.unit_price.toFixed(2)}</span>
                  <span className={styles.calculator__num}>$ {item.total.toFixed(2)}</span>
                  <button className={styles.calculator__removeBtn} onClick={() => removeItem(item.id)}>✕</button>
                </div>
              );
            })}
          </div>

          <button className={styles.calculator__addBtn} onClick={addItem}>+ Agregar item</button>

          <div className={styles.calculator__totals}>
            <div className={styles.calculator__totalRow}><span>Subtotal</span><span>$ {subtotalArs.toFixed(2)}</span></div>
            {discountPct > 0 && <div className={styles.calculator__totalRow}><span>Descuento ({discountPct}%)</span><span>-$ {discountAmt.toFixed(2)}</span></div>}
            {transport > 0 && <div className={styles.calculator__totalRow}><span>Transporte</span><span>$ {transport.toFixed(2)}</span></div>}
            {installation > 0 && <div className={styles.calculator__totalRow}><span>Instalación</span><span>$ {installation.toFixed(2)}</span></div>}
            <div className={`${styles.calculator__totalRow} ${styles["calculator__totalRow--grand"]}`}><span>Total ARS</span><span>$ {totalArs.toFixed(2)}</span></div>
            {usdRate > 0 && <div className={`${styles.calculator__totalRow} ${styles["calculator__totalRow--grand"]}`}><span>Total USD</span><span>US$ {totalUsd.toFixed(2)}</span></div>}
          </div>
        </>
      )}
    </div>
  );
}
