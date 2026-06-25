import type { Material, MaterialColor, MaterialThickness, AppOption } from "../../types";
import styles from "./BudgetForm.module.css";

interface Props {
  material: string; color: string; thickness: string; front: string; finish: string; bacha: string; anafe: string; perforations: string;
  materials: Material[]; colors: MaterialColor[]; thicknesses: MaterialThickness[];
  frontTypes: AppOption[]; finishTypes: AppOption[]; bachaTypes: AppOption[]; anafeTypes: AppOption[];
  dataLoading: boolean;
  onMaterialChange: (v: string) => void;
  onChange: (field: string, v: string) => void;
}

export function BudgetFormSpecs({
  material, color, thickness, front, finish, bacha, anafe, perforations,
  materials, colors, thicknesses, frontTypes, finishTypes, bachaTypes, anafeTypes,
  dataLoading, onMaterialChange, onChange,
}: Props) {
  return (
    <fieldset className={styles.budgetForm__fieldset}>
      <legend>Especificaciones</legend>
      <div className={styles.budgetForm__grid2}>
        <label className={styles.budgetForm__label}>Material
          <select className={styles.budgetForm__input} value={material} onChange={(e) => onMaterialChange(e.target.value)} disabled={dataLoading}>
            <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
            {materials.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
        </label>
        <label className={styles.budgetForm__label}>Color
          <select className={styles.budgetForm__input} value={color} onChange={(e) => onChange("color", e.target.value)} disabled={dataLoading}>
            <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
            {colors.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </label>
        <label className={styles.budgetForm__label}>Espesor
          <select className={styles.budgetForm__input} value={thickness} onChange={(e) => onChange("thickness", e.target.value)} disabled={dataLoading}>
            <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
            {thicknesses.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
        </label>
        <label className={styles.budgetForm__label}>Frente
          <select className={styles.budgetForm__input} value={front} onChange={(e) => onChange("front", e.target.value)} disabled={dataLoading}>
            <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
            {frontTypes.map((o) => <option key={o.id} value={o.value}>{o.value}</option>)}
          </select>
        </label>
        <label className={styles.budgetForm__label}>Terminación
          <select className={styles.budgetForm__input} value={finish} onChange={(e) => onChange("finish", e.target.value)} disabled={dataLoading}>
            <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
            {finishTypes.map((o) => <option key={o.id} value={o.value}>{o.value}</option>)}
          </select>
        </label>
        <label className={styles.budgetForm__label}>Bacha
          <select className={styles.budgetForm__input} value={bacha} onChange={(e) => onChange("bacha", e.target.value)} disabled={dataLoading}>
            <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
            {bachaTypes.map((o) => <option key={o.id} value={o.value}>{o.value}</option>)}
          </select>
        </label>
        <label className={styles.budgetForm__label}>Anafe
          <select className={styles.budgetForm__input} value={anafe} onChange={(e) => onChange("anafe", e.target.value)} disabled={dataLoading}>
            <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
            {anafeTypes.map((o) => <option key={o.id} value={o.value}>{o.value}</option>)}
          </select>
        </label>
        <label className={styles.budgetForm__label}>Perforaciones
          <input className={styles.budgetForm__input} value={perforations} onChange={(e) => onChange("perforations", e.target.value)} />
        </label>
      </div>
    </fieldset>
  );
}
