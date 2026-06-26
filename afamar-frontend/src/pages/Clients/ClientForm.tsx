import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "@/api/client";
import { FormActions } from "@/components/ui/FormActions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useGet } from "@/shared/api/hooks";
import type { Client, ClientHistoryItem } from "@/types";
import styles from "./ClientForm.module.css";

export function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const numId = id ? Number(id) : null;

  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", notes: "",
  });
  const [loading, setLoading] = useState(false);

  const { loading: dataLoading } = useGet(
    ["client", numId],
    () => api.getClient(numId!).then((c: Client) => {
      setForm({ name: c.name, phone: c.phone || "", email: c.email || "", address: c.address || "", notes: c.notes || "" });
      return c;
    }),
    isEdit
  );

  const { data: history } = useGet(
    ["clientHistory", numId],
    () => api.getClientHistory(numId!),
    isEdit
  );

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
      navigate("/admin/clients");
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) return <div className={styles.clientForm}><p>Cargando...</p></div>;

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

      {isEdit && history && (
        <div className={styles.clientForm__history}>
          <fieldset className={styles.clientForm__fieldset}>
            <legend>Historial</legend>
            <div className={styles["clientForm__stats-grid"]}>
              <div className={styles.clientForm__stat}>
                <span className={styles.clientForm__statValue}>{history.total_budgets}</span>
                <span className={styles.clientForm__statLabel}>Presupuestos</span>
              </div>
              <div className={styles.clientForm__stat}>
                <span className={styles.clientForm__statValue}>{history.total_orders}</span>
                <span className={styles.clientForm__statLabel}>Órdenes</span>
              </div>
              <div className={styles.clientForm__stat}>
                <span className={styles.clientForm__statValue}>${history.total_billed.toLocaleString()}</span>
                <span className={styles.clientForm__statLabel}>Facturado</span>
              </div>
              <div className={styles.clientForm__stat}>
                <span className={styles.clientForm__statValue}>{history.last_order_number || "—"}</span>
                <span className={styles.clientForm__statLabel}>Última OT</span>
              </div>
            </div>

            <div className={styles["clientForm__history-lists"]}>
              <div className={styles.clientForm__historyColumn}>
                <h4>Últimas Órdenes</h4>
                {history.recent_orders.length === 0 ? (
                  <p className={styles.clientForm__empty}>Sin órdenes</p>
                ) : (
                  <ul className={styles.clientForm__historyList}>
                    {history.recent_orders.map((o: ClientHistoryItem) => (
                      <li key={o.id}>
                        <Link to={`/admin/work-orders/${o.id}`}>
                          <span className={styles.clientForm__historyNumber}>{o.number}</span>
                          <StatusBadge status={o.status} />
                          <span className={styles.clientForm__historyTotal}>${o.total.toLocaleString()}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className={styles.clientForm__historyColumn}>
                <h4>Últimos Presupuestos</h4>
                {history.recent_budgets.length === 0 ? (
                  <p className={styles.clientForm__empty}>Sin presupuestos</p>
                ) : (
                  <ul className={styles.clientForm__historyList}>
                    {history.recent_budgets.map((b: ClientHistoryItem) => (
                      <li key={b.id}>
                        <Link to={`/admin/budgets/${b.id}`}>
                          <span className={styles.clientForm__historyNumber}>{b.number}</span>
                          <StatusBadge status={b.status} />
                          <span className={styles.clientForm__historyTotal}>${b.total.toLocaleString()}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </fieldset>
        </div>
      )}

      {isEdit && (
        <div className={styles.clientForm__navLinks}>
          <Link to={`/admin/budgets/new?client_id=${id}`} className={styles.clientForm__navBtn}>
            + Nuevo Presupuesto
          </Link>
          <Link to={`/admin/work-orders/new?client_id=${id}`} className={styles.clientForm__navBtn}>
            + Nueva Orden de Trabajo
          </Link>
          <Link to={`/admin/measurements`} className={styles.clientForm__navBtn}>
            + Nueva Medición
          </Link>
        </div>
      )}
    </div>
  );
}
