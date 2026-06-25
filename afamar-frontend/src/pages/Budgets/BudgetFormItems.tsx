import styles from "./BudgetForm.module.css";

export interface ItemRow { _key: number; sector: string; description: string; quantity: number; unit_price: number; total: number; length: number; width: number; m2: number; price_m2: number }

interface Props {
  items: ItemRow[];
  fabTab: string;
  onUpdate: (idx: number, field: keyof Omit<ItemRow, "_key">, value: string | number) => void;
  onAdd: (sector?: string) => void;
  onRemove: (key: number) => void;
  onFabTabChange: (tab: string) => void;
  onSetItems: (items: ItemRow[]) => void;
  emptyItemFn: (sector?: string) => ItemRow;
}

const FAB_TABS = ["ZÓCALO", "FRENTE", "TRAFOROS", "OTRA"];

function ItemInputRow({ item, idx, onUpdate, onRemove, showSector }: {
  item: ItemRow; idx: number;
  onUpdate: (idx: number, field: keyof Omit<ItemRow, "_key">, value: string | number) => void;
  onRemove: (key: number) => void;
  showSector?: boolean;
}) {
  if (item.sector === "OTRA") {
    return (
      <div className={styles.budgetForm__itemRow}>
        {showSector && <span className={styles.budgetForm__itemTotal}>{item.sector}</span>}
        <input className={styles.budgetForm__input} value={item.description} onChange={(e) => onUpdate(idx, "description", e.target.value)} placeholder="Descripción" />
        <input className={styles.budgetForm__input} type="number" value={item.unit_price || ""} onChange={(e) => onUpdate(idx, "unit_price", Number(e.target.value))} placeholder="P. Unit" />
        <span className={styles.budgetForm__itemTotal}>$ {item.total.toFixed(2)}</span>
        <button type="button" className={styles.budgetForm__removeItem} onClick={() => onRemove(item._key)}>✕</button>
      </div>
    );
  }
  return (
    <div className={styles.budgetForm__itemRow}>
      {showSector && <span className={styles.budgetForm__itemTotal}>{item.sector}</span>}
      <input className={styles.budgetForm__input} value={item.description} onChange={(e) => onUpdate(idx, "description", e.target.value)} placeholder="Descripción" />
      <input className={styles.budgetForm__input} type="number" value={item.length || ""} onChange={(e) => onUpdate(idx, "length", Number(e.target.value))} />
      <input className={styles.budgetForm__input} type="number" value={item.width || ""} onChange={(e) => onUpdate(idx, "width", Number(e.target.value))} />
      <span className={styles.budgetForm__itemTotal}>{item.m2.toFixed(4)}</span>
      <input className={styles.budgetForm__input} type="number" value={item.quantity} onChange={(e) => onUpdate(idx, "quantity", Number(e.target.value))} />
      <input className={styles.budgetForm__input} type="number" value={item.price_m2 || ""} onChange={(e) => onUpdate(idx, "price_m2", Number(e.target.value))} />
      <input className={styles.budgetForm__input} type="number" value={item.unit_price} onChange={(e) => onUpdate(idx, "unit_price", Number(e.target.value))} />
      <span className={styles.budgetForm__itemTotal}>$ {item.total.toFixed(2)}</span>
      <button type="button" className={styles.budgetForm__removeItem} onClick={() => onRemove(item._key)}>✕</button>
    </div>
  );
}

export function BudgetFormItems({ items, fabTab, onUpdate, onAdd, onRemove, onFabTabChange, onSetItems, emptyItemFn }: Props) {
  return (
    <>
      <fieldset className={styles.budgetForm__fieldset}>
        <legend>Items</legend>
        <div className={styles.budgetForm__itemsHeader}>
          <span>Descripción</span><span>Largo</span><span>Ancho</span><span>M²</span><span>Cant.</span><span>$ / M²</span><span>P. Unit</span><span>Total</span><span></span>
        </div>
        {items.map((item, i) => (
          <ItemInputRow key={item._key} item={item} idx={i} onUpdate={onUpdate} onRemove={onRemove} />
        ))}
        <button type="button" className={styles.budgetForm__addItem} onClick={() => onAdd()}>+ Agregar item</button>
      </fieldset>

      <fieldset className={styles.budgetForm__fieldset}>
        <legend>Detalles de Fabricación</legend>
        <div className={styles.budgetForm__fabTabs}>
          {FAB_TABS.map((tab) => (
            <button key={tab} type="button" className={`${styles.budgetForm__fabTab} ${fabTab === tab ? styles["budgetForm__fabTab--active"] : ""}`} onClick={() => onFabTabChange(tab)}>
              {tab}
            </button>
          ))}
        </div>
        {fabTab !== "OTRA" ? (
          <div>
            <div className={styles.budgetForm__itemsHeader}>
              <span>Descripción</span><span>Largo</span><span>Ancho</span><span>M²</span><span>Cant.</span><span>$ / M²</span><span>P. Unit</span><span>Total</span><span></span>
            </div>
            {items.filter((i) => i.sector === fabTab).map((item) => {
              const idx = items.findIndex((i) => i._key === item._key);
              return <ItemInputRow key={item._key} item={item} idx={idx} onUpdate={onUpdate} onRemove={(k) => onSetItems(items.filter((i) => i._key !== k))} />;
            })}
            <button type="button" className={styles.budgetForm__addItem} onClick={() => onSetItems([...items, emptyItemFn(fabTab)])}>+ Agregar {fabTab.toLowerCase()}</button>
          </div>
        ) : (
          <div>
            {items.filter((i) => i.sector === "OTRA").map((item) => {
              const idx = items.findIndex((i) => i._key === item._key);
              return <ItemInputRow key={item._key} item={item} idx={idx} onUpdate={onUpdate} onRemove={(k) => onSetItems(items.filter((i) => i._key !== k))} />;
            })}
            <button type="button" className={styles.budgetForm__addItem} onClick={() => onSetItems([...items, { ...emptyItemFn("OTRA"), quantity: 1, unit_price: 0 }])}>+ Agregar otra</button>
          </div>
        )}
      </fieldset>
    </>
  );
}
