import styles from "./WorkOrderForm.module.css";

export interface WoItemRow { _key: number; concept: string; detail: string; m2: number; material: string }

interface Props {
  title: string;
  items: WoItemRow[];
  onUpdate: (idx: number, field: keyof Omit<WoItemRow, "_key">, value: string | number) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}

export function WoFormItemsGrid({ title, items, onUpdate, onAdd, onRemove }: Props) {
  return (
    <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
      <legend>{title}</legend>
      <div className={styles.form__itemsHeader}>
        <span>Concepto</span><span>Detalle</span><span>M²</span><span>Material</span><span></span>
      </div>
      {items.map((item, i) => (
        <div key={item._key} className={styles.form__itemRow}>
          <input className={styles.form__input} value={item.concept} onChange={(e) => onUpdate(i, "concept", e.target.value)} placeholder="Concepto" />
          <input className={styles.form__input} value={item.detail} onChange={(e) => onUpdate(i, "detail", e.target.value)} placeholder="Detalle" />
          <input className={styles.form__input} type="number" step="0.01" value={item.m2 || ""} onChange={(e) => onUpdate(i, "m2", Number(e.target.value))} />
          <input className={styles.form__input} value={item.material} onChange={(e) => onUpdate(i, "material", e.target.value)} placeholder="Material" />
          <button type="button" className={styles.form__removeItem} onClick={() => onRemove(i)}>✕</button>
        </div>
      ))}
      <button type="button" className={styles.form__addItem} onClick={onAdd}>+ Agregar item</button>
    </fieldset>
  );
}
