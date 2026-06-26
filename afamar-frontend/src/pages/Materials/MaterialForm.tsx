import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/api/client";
import { ErrorBlock } from "@/components/ui/ErrorBlock";
import { FormActions } from "@/components/ui/FormActions";
import { useGet, useList } from "@/shared/api/hooks";
import type { Material, MaterialCategory, MaterialColor, MaterialThickness } from "@/types";
import styles from "./MaterialForm.module.css";

export function MaterialForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const numId = id ? Number(id) : null;
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [colors, setColors] = useState<MaterialColor[]>([]);
  const [thicknesses, setThicknesses] = useState<MaterialThickness[]>([]);
  const [form, setForm] = useState({ name: "", category_id: 0, color: "", available_thickness: "", base_price: 0, notes: "" });
  const [saving, setSaving] = useState(false);

  const { loading: dataLoading, error: dataError, load: loadData } = useList(["materialFormData"], async () => {
    const [cats, cols, thicks] = await Promise.all([
      api.getCategories(),
      api.getColors(),
      api.getThicknesses(),
    ]);
    setCategories(cats);
    setColors(cols);
    setThicknesses(thicks);
    if (!id && cats.length > 0) setForm((f) => ({ ...f, category_id: cats[0].id }));
    return [];
  });

  useGet(["material", numId], () => api.getMaterial(numId!).then((m: Material) => {
    setForm({ name: m.name, category_id: m.category_id, color: m.color || "", available_thickness: m.available_thickness || "", base_price: m.base_price, notes: m.notes || "" });
    return m;
  }), isEdit);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await api.updateMaterial(Number(id), form);
      } else {
        await api.createMaterial(form);
      }
      navigate("/admin/materials");
    } finally {
      setSaving(false);
    }
  };

  if (dataError && !dataLoading) {
    return (
      <div className={styles.materialForm}>
        <h2 className={styles.materialForm__title}>{isEdit ? "Editar Material" : "Nuevo Material"}</h2>
        <ErrorBlock message={dataError} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className={styles.materialForm}>
      <h2 className={styles.materialForm__title}>{isEdit ? "Editar Material" : "Nuevo Material"}</h2>
      <form className={styles.materialForm__form} onSubmit={handleSubmit}>
        <label className={styles.materialForm__label}>
          Nombre *
          <input className={styles.materialForm__input} name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label className={styles.materialForm__label}>
          Categoría
          <select className={styles.materialForm__input} name="category_id" value={form.category_id} onChange={handleChange} required disabled={dataLoading}>
            <option value={0}>{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className={styles.materialForm__label}>
          Color / Tipo
          <select className={styles.materialForm__input} name="color" value={form.color} onChange={handleChange} disabled={dataLoading}>
            <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
            {colors.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </label>
        <label className={styles.materialForm__label}>
          Espesor disponible
          <select className={styles.materialForm__input} name="available_thickness" value={form.available_thickness} onChange={handleChange} disabled={dataLoading}>
            <option value="">{dataLoading ? "Cargando..." : "Seleccionar..."}</option>
            {thicknesses.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
        </label>
        <label className={styles.materialForm__label}>
          Precio base (por m²)
          <input className={styles.materialForm__input} name="base_price" type="number" step="0.01" value={form.base_price} onChange={handleChange} />
        </label>
        <label className={styles.materialForm__label}>
          Observaciones
          <textarea className={styles.materialForm__textarea} name="notes" value={form.notes} onChange={handleChange} />
        </label>
        <FormActions loading={saving || dataLoading} />
      </form>
    </div>
  );
}
