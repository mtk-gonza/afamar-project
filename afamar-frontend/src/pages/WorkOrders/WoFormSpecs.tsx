import type { Material, MaterialColor, MaterialThickness, AppOption } from "@/types";
import styles from "./WorkOrderForm.module.css";

interface Props {
  material: string; color: string; thickness: string; bacha: string; anafe: string;
  materials: Material[]; colors: MaterialColor[]; thicknesses: MaterialThickness[];
  bachaTypes: AppOption[]; anafeTypes: AppOption[];
  dataLoading: boolean;
  onChange: (field: string, value: string) => void;
}

export function WoFormSpecs({ material, color, thickness, bacha, anafe, materials, colors, thicknesses, bachaTypes, anafeTypes, dataLoading, onChange }: Props) {
  return (
    <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
      <legend>Especificaciones</legend>
      <div className={styles.form__grid}>
        <label className={styles.form__label}>Material
          <select className={styles.form__input} value={material} onChange={(e) => onChange("material", e.target.value)} disabled={dataLoading}>
            <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
            {materials.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
        </label>
        <label className={styles.form__label}>Color
          <select className={styles.form__input} value={color} onChange={(e) => onChange("color", e.target.value)} disabled={dataLoading}>
            <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
            {colors.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </label>
        <label className={styles.form__label}>Espesor
          <select className={styles.form__input} value={thickness} onChange={(e) => onChange("thickness", e.target.value)} disabled={dataLoading}>
            <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
            {thicknesses.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
        </label>
        <label className={styles.form__label}>Bacha
          <select className={styles.form__input} value={bacha} onChange={(e) => onChange("bacha", e.target.value)} disabled={dataLoading}>
            <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
            {bachaTypes.map((o) => <option key={o.id} value={o.value}>{o.value}</option>)}
          </select>
        </label>
        <label className={styles.form__label}>Anafe
          <select className={styles.form__input} value={anafe} onChange={(e) => onChange("anafe", e.target.value)} disabled={dataLoading}>
            <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
            {anafeTypes.map((o) => <option key={o.id} value={o.value}>{o.value}</option>)}
          </select>
        </label>
      </div>
    </fieldset>
  );
}
