import styles from "./OnlineBudgets.module.css";

interface Props {
  clientName: string;
  phone: string;
  workType: string;
  date: string;
  usdRate: number;
  dataLoading: boolean;
  onClientNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onWorkTypeChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onUsdRateChange: (v: number) => void;
}

export function ObFormHeader({
  clientName, phone, workType, date, usdRate, dataLoading,
  onClientNameChange, onPhoneChange, onWorkTypeChange, onDateChange, onUsdRateChange,
}: Props) {
  return (
    <fieldset className={styles.onlineBudgets__fieldset}>
      <legend>Datos del presupuesto</legend>
      <div className={styles.onlineBudgets__grid4}>
        <label className={styles.onlineBudgets__label}>Cliente / Empresa
          <input className={styles.onlineBudgets__input} value={clientName} onChange={(e) => onClientNameChange(e.target.value)} required disabled={dataLoading} />
        </label>
        <label className={styles.onlineBudgets__label}>Teléfono (WhatsApp)
          <input className={styles.onlineBudgets__input} value={phone} onChange={(e) => onPhoneChange(e.target.value)} placeholder="Ej: 2215551234" disabled={dataLoading} />
        </label>
        <label className={styles.onlineBudgets__label}>Tipo de obra
          <input className={styles.onlineBudgets__input} value={workType} onChange={(e) => onWorkTypeChange(e.target.value)} placeholder="Ej: Cocina, Baño" disabled={dataLoading} />
        </label>
        <label className={styles.onlineBudgets__label}>Fecha
          <input type="date" className={styles.onlineBudgets__input} value={date} onChange={(e) => onDateChange(e.target.value)} disabled={dataLoading} />
        </label>
        <label className={styles.onlineBudgets__label} style={{ fontWeight: 700, color: "#1e40af" }}>Dólar del día
          <input type="number" step="1" className={styles.onlineBudgets__input} style={{ fontWeight: 700, color: "#1e40af" }}
            value={usdRate} onChange={(e) => onUsdRateChange(Number(e.target.value) || 0)} disabled={dataLoading} />
        </label>
      </div>
    </fieldset>
  );
}
