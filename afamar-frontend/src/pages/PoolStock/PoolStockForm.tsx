import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/api/client";
import { FormActions } from "@/components/ui/FormActions";
import { useGet } from "@/shared/api/hooks";
import type { PoolStock } from "@/types";
import styles from "./PoolStockForm.module.css";

export function PoolStockForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const numId = id ? Number(id) : null;
  const [form, setForm] = useState({ brand: "", model: "", description: "", material: "", quantity: 0 });
  const [loading, setLoading] = useState(false);

  useGet(["poolStock", numId], () => api.getPoolStockById(numId!).then((p: PoolStock) => {
    setForm({ brand: p.brand, model: p.model, description: p.description || "", material: p.material || "", quantity: p.quantity });
    return p;
  }), isEdit);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.name === "quantity" ? Number(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.updatePoolStock(Number(id), form);
      } else {
        await api.createPoolStock(form);
      }
      navigate("/admin/pool-stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.poolStockForm}>
      <h2 className={styles.poolStockForm__title}>{isEdit ? "Editar Stock" : "Nuevo Item de Stock"}</h2>
      <form className={styles.poolStockForm__form} onSubmit={handleSubmit}>
        <label className={styles.poolStockForm__label}>Marca *<input className={styles.poolStockForm__input} name="brand" value={form.brand} onChange={handleChange} required /></label>
        <label className={styles.poolStockForm__label}>Modelo *<input className={styles.poolStockForm__input} name="model" value={form.model} onChange={handleChange} required /></label>
        <label className={styles.poolStockForm__label}>Descripción<textarea className={styles.poolStockForm__textarea} name="description" value={form.description} onChange={handleChange} /></label>
        <label className={styles.poolStockForm__label}>Material<input className={styles.poolStockForm__input} name="material" value={form.material} onChange={handleChange} /></label>
        <label className={styles.poolStockForm__label}>Cantidad<input className={styles.poolStockForm__input} name="quantity" type="number" value={form.quantity} onChange={handleChange} /></label>
        <FormActions loading={loading} />
      </form>
    </div>
  );
}
