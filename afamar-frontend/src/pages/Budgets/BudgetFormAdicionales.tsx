import styles from "./BudgetForm.module.css";

export interface AdicionalRow { _key: number; concept: string; detail: string; quantity: number; unit_price: number; total: number }

interface Props {
  adicionales: AdicionalRow[];
  onUpdate: (idx: number, field: keyof Omit<AdicionalRow, "_key">, value: string | number) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}

export function BudgetFormAdicionales({ adicionales, onUpdate, onAdd, onRemove }: Props) {
  return (
    <fieldset className={styles.budgetForm__fieldset}>
      <legend>Adicionales</legend>
      <div className={styles.budgetForm__adicionalesHeader}>
        <span>Concepto</span><span>Detalle</span><span>Cant.</span><span>P. Unit</span><span>Total</span><span></span>
      </div>
      {adicionales.map((a, i) => (
        <div key={a._key} className={styles.budgetForm__adicionalRow}>
          <input className={styles.budgetForm__input} value={a.concept} onChange={(e) => onUpdate(i, "concept", e.target.value)} placeholder="Concepto" />
          <input className={styles.budgetForm__input} value={a.detail} onChange={(e) => onUpdate(i, "detail", e.target.value)} placeholder="Detalle" />
          <input className={styles.budgetForm__input} type="number" value={a.quantity} onChange={(e) => onUpdate(i, "quantity", Number(e.target.value))} />
          <input className={styles.budgetForm__input} type="number" value={a.unit_price} onChange={(e) => onUpdate(i, "unit_price", Number(e.target.value))} />
          <span className={styles.budgetForm__itemTotal}>$ {a.total.toFixed(2)}</span>
          <button type="button" className={styles.budgetForm__removeItem} onClick={() => onRemove(i)}>✕</button>
        </div>
      ))}
      <button type="button" className={styles.budgetForm__addItem} onClick={onAdd}>+ Agregar adicional</button>
    </fieldset>
  );
}
