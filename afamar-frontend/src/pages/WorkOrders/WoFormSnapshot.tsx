import styles from "./WorkOrderForm.module.css";

interface Props {
  name: string; phone: string; email: string; address: string; notes: string;
  onChange: (field: string, value: string) => void;
}

export function WoFormSnapshot({ name, phone, email, address, notes, onChange }: Props) {
  return (
    <>
      <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
        <legend>Datos del cliente (snapshot)</legend>
        <div className={styles.form__grid}>
          <label className={styles.form__label}>Nombre
            <input className={styles.form__input} value={name} onChange={(e) => onChange("snapshot_name", e.target.value)} />
          </label>
          <label className={styles.form__label}>Teléfono
            <input className={styles.form__input} value={phone} onChange={(e) => onChange("snapshot_phone", e.target.value)} />
          </label>
          <label className={styles.form__label}>Email
            <input className={styles.form__input} value={email} onChange={(e) => onChange("snapshot_email", e.target.value)} />
          </label>
          <label className={styles.form__label}>Dirección
            <input className={styles.form__input} value={address} onChange={(e) => onChange("snapshot_address", e.target.value)} />
          </label>
        </div>
      </fieldset>

      <label className={`${styles.form__label} ${styles["form__label--full"]}`}>
        Observaciones generales
        <textarea className={styles.form__textarea} value={notes} onChange={(e) => onChange("notes", e.target.value)} />
      </label>
    </>
  );
}
