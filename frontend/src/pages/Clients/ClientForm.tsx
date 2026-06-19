import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { FormActions } from "../../components/ui/FormActions";
import type { Client } from "../../types";
import styles from "./ClientForm.module.css";

export function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", notes: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      api.getClient(Number(id)).then((c: Client) =>
        setForm({ name: c.name, phone: c.phone || "", email: c.email || "", address: c.address || "", notes: c.notes || "" })
      );
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.updateClient(Number(id), form);
      } else {
        await api.createClient(form);
      }
      navigate("/clients");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.clientForm}>
      <h2 className={styles.clientForm__title}>{isEdit ? "Editar Cliente" : "Nuevo Cliente"}</h2>
      <form className={styles.clientForm__form} onSubmit={handleSubmit}>
        <label className={styles.clientForm__label}>
          Nombre *
          <input className={styles.clientForm__input} name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label className={styles.clientForm__label}>
          Teléfono
          <input className={styles.clientForm__input} name="phone" value={form.phone} onChange={handleChange} />
        </label>
        <label className={styles.clientForm__label}>
          Email
          <input className={styles.clientForm__input} name="email" type="email" value={form.email} onChange={handleChange} />
        </label>
        <label className={styles.clientForm__label}>
          Dirección
          <input className={styles.clientForm__input} name="address" value={form.address} onChange={handleChange} />
        </label>
        <label className={styles.clientForm__label}>
          Observaciones
          <textarea className={styles.clientForm__textarea} name="notes" value={form.notes} onChange={handleChange} />
        </label>
        <FormActions loading={loading} />
      </form>
    </div>
  );
}
