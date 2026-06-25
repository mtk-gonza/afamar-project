import type { Client } from "../../types";
import styles from "./BudgetForm.module.css";

interface Props {
  clientId: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  clients: Client[];
  dataLoading: boolean;
  onClientChange: (id: number, c: Client | undefined) => void;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onAddressChange: (v: string) => void;
}

export function BudgetFormClient({
  clientId, clientName, clientPhone, clientEmail, clientAddress,
  clients, dataLoading, onClientChange, onNameChange, onPhoneChange, onEmailChange, onAddressChange,
}: Props) {
  return (
    <fieldset className={styles.budgetForm__fieldset}>
      <legend>Cliente</legend>
      <select className={styles.budgetForm__input} value={clientId} onChange={(e) => {
        const id = Number(e.target.value);
        const c = clients.find((cl) => cl.id === id);
        onClientChange(id, c);
      }} disabled={dataLoading}>
        <option value={0}>{dataLoading ? "Cargando clientes..." : "Seleccionar cliente..."}</option>
        {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div className={styles.budgetForm__grid2} style={{ marginTop: "0.5rem" }}>
        <label className={styles.budgetForm__label}>Nombre
          <input className={styles.budgetForm__input} value={clientName} onChange={(e) => onNameChange(e.target.value)} placeholder={clientId > 0 ? "Usando cliente existente" : "Nombre del cliente"} />
        </label>
        <label className={styles.budgetForm__label}>Teléfono
          <input className={styles.budgetForm__input} value={clientPhone} onChange={(e) => onPhoneChange(e.target.value)} />
        </label>
        <label className={styles.budgetForm__label}>Email
          <input className={styles.budgetForm__input} value={clientEmail} onChange={(e) => onEmailChange(e.target.value)} />
        </label>
        <label className={styles.budgetForm__label}>Dirección
          <input className={styles.budgetForm__input} value={clientAddress} onChange={(e) => onAddressChange(e.target.value)} />
        </label>
      </div>
    </fieldset>
  );
}
