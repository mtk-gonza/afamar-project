import type { PoolStock } from "@/types";
import styles from "./WorkOrderForm.module.css";

interface Props {
  currency: string; usdRate: number;
  poolId: number; poolPrice: number; poolCurrency: string; pools: PoolStock[];
  subtotal: number; transport: number; installation: number; discount: number; total: number;
  subtotalUsd: number; transportUsd: number; totalUsd: number;
  depositReceived: number; depositCurrency: string; depositUsd: number;
  balanceDue: number; balanceDueUsd: number; balancePaid: boolean;
  paymentMethod: string; installments: number;
  dataLoading: boolean;
  onChange: (field: string, value: string | number | boolean) => void;
}

export function WoFormFinancial({
  currency, usdRate, poolId, poolPrice, poolCurrency, pools,
  subtotal, transport, installation, discount, total,
  subtotalUsd, transportUsd, totalUsd,
  depositReceived, depositCurrency, depositUsd,
  balanceDue, balanceDueUsd, balancePaid,
  paymentMethod, installments,
  dataLoading, onChange,
}: Props) {
  return (
    <>
      <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
        <legend>Pileta</legend>
        <div className={styles.form__grid}>
          <label className={styles.form__label}>Pileta
            <select className={styles.form__input} value={poolId} onChange={(e) => onChange("pool_id", Number(e.target.value))} disabled={dataLoading}>
              <option value={0}>Sin pileta</option>
              {pools.map((p) => <option key={p.id} value={p.id}>{p.brand} {p.model}</option>)}
            </select>
          </label>
          <label className={styles.form__label}>Precio pileta
            <input className={styles.form__input} type="number" step="0.01" value={poolPrice} onChange={(e) => onChange("pool_price", Number(e.target.value))} />
          </label>
          <label className={styles.form__label}>Moneda pileta
            <select className={styles.form__input} value={poolCurrency} onChange={(e) => onChange("pool_currency", e.target.value)}>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
        <legend>Moneda y cotización</legend>
        <div className={styles.form__grid}>
          <label className={styles.form__label}>Moneda
            <select className={styles.form__input} value={currency} onChange={(e) => onChange("currency", e.target.value)}>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label className={styles.form__label}>Cotización USD
            <input className={styles.form__input} type="number" step="0.01" value={usdRate} onChange={(e) => onChange("usd_rate", Number(e.target.value))} />
          </label>
        </div>
      </fieldset>

      <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
        <legend>Valores ARS</legend>
        <div className={styles.form__grid2}>
          <label className={styles.form__label}>Subtotal
            <input className={styles.form__input} type="number" step="0.01" value={subtotal} onChange={(e) => onChange("subtotal", Number(e.target.value))} />
          </label>
          <label className={styles.form__label}>Transporte
            <input className={styles.form__input} type="number" step="0.01" value={transport} onChange={(e) => onChange("transport", Number(e.target.value))} />
          </label>
          <label className={styles.form__label}>Instalación
            <input className={styles.form__input} type="number" step="0.01" value={installation} onChange={(e) => onChange("installation", Number(e.target.value))} />
          </label>
          <label className={styles.form__label}>Descuento
            <input className={styles.form__input} type="number" step="0.01" value={discount} onChange={(e) => onChange("discount", Number(e.target.value))} />
          </label>
          <label className={styles.form__label}>Total ARS
            <input className={styles.form__input} type="number" step="0.01" value={total} onChange={(e) => onChange("total", Number(e.target.value))} />
          </label>
        </div>
      </fieldset>

      <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
        <legend>Valores USD</legend>
        <div className={styles.form__grid2}>
          <label className={styles.form__label}>Subtotal USD
            <input className={styles.form__input} type="number" step="0.01" value={subtotalUsd} onChange={(e) => onChange("subtotal_usd", Number(e.target.value))} />
          </label>
          <label className={styles.form__label}>Transporte USD
            <input className={styles.form__input} type="number" step="0.01" value={transportUsd} onChange={(e) => onChange("transport_usd", Number(e.target.value))} />
          </label>
          <label className={styles.form__label}>Total USD
            <input className={styles.form__input} type="number" step="0.01" value={totalUsd} onChange={(e) => onChange("total_usd", Number(e.target.value))} />
          </label>
        </div>
      </fieldset>

      <fieldset className={`${styles.form__fieldset} ${styles["form__fieldset--full"]}`}>
        <legend>Información de pago</legend>
        <div className={styles.form__grid2}>
          <label className={styles.form__label}>Seña recibida
            <input className={styles.form__input} type="number" step="0.01" value={depositReceived} onChange={(e) => onChange("deposit_received", Number(e.target.value))} />
          </label>
          <label className={styles.form__label}>Moneda seña
            <select className={styles.form__input} value={depositCurrency} onChange={(e) => onChange("deposit_currency", e.target.value)}>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label className={styles.form__label}>Seña USD
            <input className={styles.form__input} type="number" step="0.01" value={depositUsd} onChange={(e) => onChange("deposit_usd", Number(e.target.value))} />
          </label>
          <label className={styles.form__label}>Saldo pendiente ARS
            <input className={styles.form__input} type="number" step="0.01" value={balanceDue} onChange={(e) => onChange("balance_due", Number(e.target.value))} />
          </label>
          <label className={styles.form__label}>Saldo pendiente USD
            <input className={styles.form__input} type="number" step="0.01" value={balanceDueUsd} onChange={(e) => onChange("balance_due_usd", Number(e.target.value))} />
          </label>
          <label className={`${styles.form__label} ${styles.form__checkboxRow}`}>
            <input type="checkbox" checked={balancePaid} onChange={(e) => onChange("balance_paid", e.target.checked)} />
            Pagado
          </label>
          <label className={styles.form__label}>Método de pago
            <input className={styles.form__input} value={paymentMethod} onChange={(e) => onChange("payment_method", e.target.value)} />
          </label>
          <label className={styles.form__label}>Cuotas
            <input className={styles.form__input} type="number" value={installments} onChange={(e) => onChange("installments", Number(e.target.value))} />
          </label>
        </div>
      </fieldset>
    </>
  );
}
