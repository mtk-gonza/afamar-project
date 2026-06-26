import { useMemo } from "react";
import type { Client } from "@/types";
import { useReferences } from "@/context/ReferencesContext";
import styles from "./WorkOrderForm.module.css";

interface Props {
  clientId: number;
  clientName: string; clientPhone: string; clientEmail: string; clientAddress: string;
  status: string; priority: string; deliveryDate: string;
  clients: Client[]; dataLoading: boolean; isEdit: boolean;
  onClientChange: (id: number, name: string) => void;
  onClientFieldChange: (field: string, value: string) => void;
  onStatusChange: (s: string) => void;
  onPriorityChange: (v: string) => void;
  onDeliveryDateChange: (v: string) => void;
}

export function WoFormBasic({
  clientId, clientName, clientPhone, clientEmail, clientAddress,
  status, priority, deliveryDate, clients, dataLoading, isEdit,
  onClientChange, onClientFieldChange,
  onStatusChange, onPriorityChange, onDeliveryDateChange,
}: Props) {
  const { workOrderStatuses, priorityLevels } = useReferences();
  const STATUS_ORDER = useMemo(() => workOrderStatuses.map((s) => s.name), [workOrderStatuses]);
  const activeStatuses = useMemo(() => workOrderStatuses.filter((s) => s.is_active), [workOrderStatuses]);
  const activePriorities = useMemo(() => priorityLevels.filter((p) => p.is_active), [priorityLevels]);

  return (
    <>
      <label className={styles.form__label}>Cliente *
        <select className={styles.form__input} value={clientId} onChange={(e) => onClientChange(Number(e.target.value), e.target.options[e.target.selectedIndex]?.text || "")} disabled={dataLoading}>
          <option value={0}>{dataLoading ? "Cargando clientes..." : "Seleccionar..."}</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {clientId === 0 && (
          <div className={styles.form__clientFields}>
            <input className={styles.form__input} placeholder="Nombre del cliente *" value={clientName} onChange={(e) => onClientFieldChange("client_name", e.target.value)} />
            <input className={styles.form__input} placeholder="Teléfono" value={clientPhone} onChange={(e) => onClientFieldChange("client_phone", e.target.value)} />
            <input className={styles.form__input} placeholder="Email" value={clientEmail} onChange={(e) => onClientFieldChange("client_email", e.target.value)} />
            <input className={styles.form__input} placeholder="Dirección" value={clientAddress} onChange={(e) => onClientFieldChange("client_address", e.target.value)} />
          </div>
        )}
      </label>

      <label className={styles.form__label}>Estado
        <div className={styles.form__statusRow}>
          {activeStatuses.map((s) => {
            const currentIdx = STATUS_ORDER.indexOf(status);
            const thisIdx = STATUS_ORDER.indexOf(s.name);
            const canTransition = isEdit ? thisIdx >= currentIdx : true;
            return (
              <button key={s.name} type="button"
                className={`${styles.form__statusBtn} ${status === s.name ? styles["form__statusBtn--active"] : ""} ${!canTransition ? styles["form__statusBtn--disabled"] : ""}`}
                disabled={!canTransition}
                onClick={() => onStatusChange(s.name)}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </label>

      <label className={styles.form__label}>Prioridad
        <select className={styles.form__input} value={priority} onChange={(e) => onPriorityChange(e.target.value)}>
          {activePriorities.map((p) => (
            <option key={p.name} value={p.name}>{p.label}</option>
          ))}
        </select>
      </label>

      <label className={styles.form__label}>Fecha de entrega
        <input className={styles.form__input} type="date" value={deliveryDate} onChange={(e) => onDeliveryDateChange(e.target.value)} />
      </label>
    </>
  );
}
