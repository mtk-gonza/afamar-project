import styles from "./BudgetForm.module.css";

interface Props {
  design: string; important: string; fabrication: string; notes: string;
  snapshotName: string; snapshotPhone: string; snapshotEmail: string; snapshotAddress: string;
  onDesignChange: (v: string) => void;
  onImportantChange: (v: string) => void;
  onFabricationChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onSnapshotNameChange: (v: string) => void;
  onSnapshotPhoneChange: (v: string) => void;
  onSnapshotEmailChange: (v: string) => void;
  onSnapshotAddressChange: (v: string) => void;
}

export function BudgetFormObservations({
  design, important, fabrication, notes,
  snapshotName, snapshotPhone, snapshotEmail, snapshotAddress,
  onDesignChange, onImportantChange, onFabricationChange, onNotesChange,
  onSnapshotNameChange, onSnapshotPhoneChange, onSnapshotEmailChange, onSnapshotAddressChange,
}: Props) {
  return (
    <>
      <fieldset className={styles.budgetForm__fieldset}>
        <legend>Observaciones</legend>
        <div className={styles.budgetForm__grid2}>
          <label className={styles.budgetForm__label}>Diseño
            <textarea className={styles.budgetForm__textarea} value={design} onChange={(e) => onDesignChange(e.target.value)} />
          </label>
          <label className={styles.budgetForm__label}>Importantes
            <textarea className={styles.budgetForm__textarea} value={important} onChange={(e) => onImportantChange(e.target.value)} />
          </label>
          <label className={styles.budgetForm__label}>Fabricación
            <textarea className={styles.budgetForm__textarea} value={fabrication} onChange={(e) => onFabricationChange(e.target.value)} />
          </label>
          <label className={styles.budgetForm__label}>Generales
            <textarea className={styles.budgetForm__textarea} value={notes} onChange={(e) => onNotesChange(e.target.value)} />
          </label>
        </div>
      </fieldset>

      <fieldset className={styles.budgetForm__fieldset}>
        <legend>Datos del cliente (snapshot)</legend>
        <div className={styles.budgetForm__grid2}>
          <label className={styles.budgetForm__label}>Nombre
            <input className={styles.budgetForm__input} value={snapshotName} onChange={(e) => onSnapshotNameChange(e.target.value)} />
          </label>
          <label className={styles.budgetForm__label}>Teléfono
            <input className={styles.budgetForm__input} value={snapshotPhone} onChange={(e) => onSnapshotPhoneChange(e.target.value)} />
          </label>
          <label className={styles.budgetForm__label}>Email
            <input className={styles.budgetForm__input} value={snapshotEmail} onChange={(e) => onSnapshotEmailChange(e.target.value)} />
          </label>
          <label className={styles.budgetForm__label}>Dirección
            <input className={styles.budgetForm__input} value={snapshotAddress} onChange={(e) => onSnapshotAddressChange(e.target.value)} />
          </label>
        </div>
      </fieldset>
    </>
  );
}
