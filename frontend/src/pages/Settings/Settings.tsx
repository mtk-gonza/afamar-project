import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { AppOption, MaterialCategory, MaterialColor, MaterialThickness, SettingsData } from "../../types";
import styles from "./Settings.module.css";

const OPTION_CATEGORIES = [
  { key: "finish_type", label: "Tipos de terminación" },
  { key: "front_type", label: "Tipos de frente" },
  { key: "bacha_type", label: "Tipos de bacha" },
  { key: "anafe_type", label: "Tipos de anafe" },
];

type Tab = "general" | "opciones";

export function Settings() {
  const [tab, setTab] = useState<Tab>("general");

  // ── Tab: General ──
  const [settings, setSettings] = useState<SettingsData>({
    company_name: "", company_address: "", company_phone: "", company_email: "",
    pdf_footer: "", budget_terms: "", delivery_terms: "", warranty_text: "",
  });
  const [saved, setSaved] = useState(false);
  const [_loadError, setLoadError] = useState(false);

  // ── Tab: Opciones ──
  const [options, setOptions] = useState<Record<string, AppOption[]>>({});
  const [newOptionVals, setNewOptionVals] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [colors, setColors] = useState<MaterialColor[]>([]);
  const [newColor, setNewColor] = useState("");
  const [thicknesses, setThicknesses] = useState<MaterialThickness[]>([]);
  const [newThickness, setNewThickness] = useState("");

  // ── Load ──
  const loadGeneral = useCallback(() => {
    api.getSettings().then(setSettings).catch(() => setLoadError(true));
  }, []);

  const loadOptions = useCallback(() => {
    OPTION_CATEGORIES.forEach((cat) => {
      api.getOptions(cat.key).then((opts: any) => setOptions((prev) => ({ ...prev, [cat.key]: opts }))).catch(() => setLoadError(true));
    });
    api.getCategories().then(setCategories).catch(() => setLoadError(true));
    api.getColors().then(setColors).catch(() => setLoadError(true));
    api.getThicknesses().then(setThicknesses).catch(() => setLoadError(true));
  }, []);

  useEffect(() => { loadGeneral(); }, [loadGeneral]);
  useEffect(() => { loadOptions(); }, [loadOptions]);

  const saveSettings = async () => {
    await api.updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ── Handlers: Opciones ──
  const addOption = async (category: string) => {
    const val = newOptionVals[category]?.trim();
    if (!val) return;
    await api.createOption({ category, value: val });
    setNewOptionVals((prev) => ({ ...prev, [category]: "" }));
    loadOptions();
  };

  const deleteOption = async (id: number) => {
    await api.deleteOption(id);
    loadOptions();
  };

  const addCategory = async () => {
    const val = newCategory.trim();
    if (!val) return;
    await api.createCategory({ name: val });
    setNewCategory("");
    loadOptions();
  };

  const deleteCategory = async (id: number) => {
    await api.deleteCategory(id);
    loadOptions();
  };

  const addColor = async () => {
    const val = newColor.trim();
    if (!val) return;
    await api.createColor({ name: val });
    setNewColor("");
    loadOptions();
  };

  const deleteColor = async (id: number) => {
    await api.deleteColor(id);
    loadOptions();
  };

  const addThickness = async () => {
    const val = newThickness.trim();
    if (!val) return;
    await api.createThickness({ name: val });
    setNewThickness("");
    loadOptions();
  };

  const deleteThickness = async (id: number) => {
    await api.deleteThickness(id);
    loadOptions();
  };

  return (
    <div className={styles.settings}>
      <h2 className={styles.settings__title}>Configuración</h2>

      {/* Tabs */}
      <div className={styles.settings__tabs}>
        <button
          type="button"
          className={`${styles.settings__tab} ${tab === "general" ? styles["settings__tab--active"] : ""}`}
          onClick={() => setTab("general")}
        >
          General
        </button>
        <button
          type="button"
          className={`${styles.settings__tab} ${tab === "opciones" ? styles["settings__tab--active"] : ""}`}
          onClick={() => setTab("opciones")}
        >
          Opciones
        </button>
      </div>

      {tab === "general" && (
        <div className={styles.settings__form}>
          <fieldset className={styles.settings__fieldset}>
            <legend>Datos de la empresa</legend>
            <div className={styles.settings__grid2}>
              <label className={styles.settings__label}>
                Nombre <input className={styles.settings__input} value={settings.company_name} onChange={(e) => setSettings((s) => ({ ...s, company_name: e.target.value }))} />
              </label>
              <label className={styles.settings__label}>
                Teléfono <input className={styles.settings__input} value={settings.company_phone} onChange={(e) => setSettings((s) => ({ ...s, company_phone: e.target.value }))} />
              </label>
              <label className={styles.settings__label}>
                Dirección <input className={styles.settings__input} value={settings.company_address} onChange={(e) => setSettings((s) => ({ ...s, company_address: e.target.value }))} />
              </label>
              <label className={styles.settings__label}>
                Email <input className={styles.settings__input} value={settings.company_email} onChange={(e) => setSettings((s) => ({ ...s, company_email: e.target.value }))} />
              </label>
            </div>
          </fieldset>

          <fieldset className={styles.settings__fieldset}>
            <legend>Logo de la empresa</legend>
            <div className={styles.settings__logoRow}>
              {settings.company_logo && (
                <img src={settings.company_logo} alt="Logo" className={styles.settings__logoPreview} />
              )}
              <div className={styles.settings__logoFields}>
                <label className={styles.settings__label}>
                  URL del logo
                  <input className={styles.settings__input} value={settings.company_logo} onChange={(e) => setSettings((s) => ({ ...s, company_logo: e.target.value }))} placeholder="https://ejemplo.com/logo.png" />
                </label>
                <label className={styles.settings__label}>
                  O subir archivo
                  <input type="file" accept="image/*" className={styles.settings__input} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setSettings((s) => ({ ...s, company_logo: reader.result as string }));
                    reader.readAsDataURL(file);
                  }} />
                </label>
              </div>
            </div>
          </fieldset>

          <fieldset className={styles.settings__fieldset}>
            <legend>PDF / Documentos</legend>
            <label className={styles.settings__label}>
              Texto pie de página
              <textarea className={styles.settings__textarea} value={settings.pdf_footer} onChange={(e) => setSettings((s) => ({ ...s, pdf_footer: e.target.value }))} />
            </label>
          </fieldset>

          <fieldset className={styles.settings__fieldset}>
            <legend>Textos automáticos</legend>
            <label className={styles.settings__label}>
              Términos del presupuesto
              <textarea className={styles.settings__textarea} value={settings.budget_terms} onChange={(e) => setSettings((s) => ({ ...s, budget_terms: e.target.value }))} />
            </label>
            <label className={styles.settings__label}>
              Condiciones de entrega
              <textarea className={styles.settings__textarea} value={settings.delivery_terms} onChange={(e) => setSettings((s) => ({ ...s, delivery_terms: e.target.value }))} />
            </label>
            <label className={styles.settings__label}>
              Texto de garantía
              <textarea className={styles.settings__textarea} value={settings.warranty_text} onChange={(e) => setSettings((s) => ({ ...s, warranty_text: e.target.value }))} />
            </label>
          </fieldset>

          <div className={styles.settings__actions}>
            <button type="button" className={styles.settings__submit} onClick={saveSettings}>
              {saved ? "✓ Guardado" : "Guardar cambios"}
            </button>
          </div>
        </div>
      )}

      {tab === "opciones" && (
        <div className={styles.settings__form}>

          {/* ── Categorías ── */}
          <fieldset className={styles.settings__fieldset}>
            <legend>Categorías de materiales</legend>
            <div className={styles.settings__optionRow}>
              <input className={styles.settings__input} value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nueva categoría..." />
              <button type="button" className={styles.settings__addBtn} onClick={addCategory}>+</button>
            </div>
            <div className={styles.settings__tags}>
              {categories.map((c) => (
                <span key={c.id} className={styles.settings__tag}>
                  {c.name}
                  <button type="button" className={styles.settings__tagRemove} onClick={() => deleteCategory(c.id)}>✕</button>
                </span>
              ))}
            </div>
          </fieldset>

          {/* ── Colores ── */}
          <fieldset className={styles.settings__fieldset}>
            <legend>Colores</legend>
            <div className={styles.settings__optionRow}>
              <input className={styles.settings__input} value={newColor} onChange={(e) => setNewColor(e.target.value)} placeholder="Nuevo color..." />
              <button type="button" className={styles.settings__addBtn} onClick={addColor}>+</button>
            </div>
            <div className={styles.settings__tags}>
              {colors.map((c) => (
                <span key={c.id} className={styles.settings__tag}>
                  {c.name}
                  <button type="button" className={styles.settings__tagRemove} onClick={() => deleteColor(c.id)}>✕</button>
                </span>
              ))}
            </div>
          </fieldset>

          {/* ── Espesores ── */}
          <fieldset className={styles.settings__fieldset}>
            <legend>Espesores</legend>
            <div className={styles.settings__optionRow}>
              <input className={styles.settings__input} value={newThickness} onChange={(e) => setNewThickness(e.target.value)} placeholder="Nuevo espesor..." />
              <button type="button" className={styles.settings__addBtn} onClick={addThickness}>+</button>
            </div>
            <div className={styles.settings__tags}>
              {thicknesses.map((t) => (
                <span key={t.id} className={styles.settings__tag}>
                  {t.name}
                  <button type="button" className={styles.settings__tagRemove} onClick={() => deleteThickness(t.id)}>✕</button>
                </span>
              ))}
            </div>
          </fieldset>

          {/* ── Opciones de especificaciones ── */}
          {OPTION_CATEGORIES.map((cat) => (
            <fieldset key={cat.key} className={styles.settings__fieldset}>
              <legend>{cat.label}</legend>
              <div className={styles.settings__optionRow}>
                <input className={styles.settings__input} value={newOptionVals[cat.key] || ""} onChange={(e) => setNewOptionVals((p) => ({ ...p, [cat.key]: e.target.value }))} placeholder="Nuevo valor..." />
                <button type="button" className={styles.settings__addBtn} onClick={() => addOption(cat.key)}>+</button>
              </div>
              <div className={styles.settings__tags}>
                {(options[cat.key] || []).map((o) => (
                  <span key={o.id} className={styles.settings__tag}>
                    {o.value}
                    <button type="button" className={styles.settings__tagRemove} onClick={() => deleteOption(o.id)}>✕</button>
                  </span>
                ))}
              </div>
            </fieldset>
          ))}

        </div>
      )}
    </div>
  );
}
