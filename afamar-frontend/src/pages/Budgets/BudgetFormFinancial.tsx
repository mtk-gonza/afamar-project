import type { PoolStock, ReferenceItem } from "../../types";
import styles from "./BudgetForm.module.css";

interface Props {
  paymentMethods: ReferenceItem[];
  currency: string; usdRate: number; discountPct: number; discountType: string;
  transport: number; installation: number; depositReceived: number; depositCurrency: string;
  installments: number; cardSurchargePct: number;
  poolId: number; poolPrice: number; poolCurrency: string;
  paymentMethod: string; validityDays: number; estimatedDelivery: string; estimatedDate: string;
  poolStock: PoolStock[];
  subtotalTotal: number; discountAmt: number; cardSurcharge: number; totalArs: number; totalUsd: number; balanceDue: number;
  onCurrencyChange: (v: string) => void;
  onUsdRateChange: (v: number) => void;
  onDiscountPctChange: (v: number) => void;
  onDiscountTypeChange: (v: string) => void;
  onTransportChange: (v: number) => void;
  onInstallationChange: (v: number) => void;
  onDepositReceivedChange: (v: number) => void;
  onDepositCurrencyChange: (v: string) => void;
  onInstallmentsChange: (v: number) => void;
  onCardSurchargePctChange: (v: number) => void;
  onPoolIdChange: (id: number) => void;
  onPoolPriceChange: (v: number) => void;
  onPoolCurrencyChange: (v: string) => void;
  onPaymentMethodChange: (v: string) => void;
  onValidityDaysChange: (v: number) => void;
  onEstimatedDeliveryChange: (v: string) => void;
  onEstimatedDateChange: (v: string) => void;
}

export function BudgetFormFinancial({
  currency, usdRate, discountPct, discountType, transport, installation,
  depositReceived, depositCurrency, installments, cardSurchargePct,
  poolId, poolPrice, poolCurrency,
  paymentMethod, validityDays, estimatedDelivery, estimatedDate,
  poolStock, subtotalTotal, discountAmt, cardSurcharge, totalArs, totalUsd, balanceDue,
  paymentMethods,
  onCurrencyChange, onUsdRateChange, onDiscountPctChange, onDiscountTypeChange,
  onTransportChange, onInstallationChange, onDepositReceivedChange, onDepositCurrencyChange,
  onInstallmentsChange, onCardSurchargePctChange,
  onPoolIdChange, onPoolPriceChange, onPoolCurrencyChange,
  onPaymentMethodChange, onValidityDaysChange, onEstimatedDeliveryChange, onEstimatedDateChange,
}: Props) {
  return (
    <>
      <fieldset className={styles.budgetForm__fieldset}>
        <legend>Pool / Pileta</legend>
        <div className={styles.budgetForm__grid2}>
          <label className={styles.budgetForm__label}>Pool
            <select className={styles.budgetForm__input} value={poolId} onChange={(e) => onPoolIdChange(Number(e.target.value))}>
              <option value={0}>Sin pool</option>
              {poolStock.map((p) => (
                <option key={p.id} value={p.id}>{p.brand} {p.model} (${p.price})</option>
              ))}
            </select>
          </label>
          <label className={styles.budgetForm__label}>Precio pool
            <input className={styles.budgetForm__input} type="number" value={poolPrice} onChange={(e) => onPoolPriceChange(Number(e.target.value))} />
          </label>
          <label className={styles.budgetForm__label}>Moneda pool
            <select className={styles.budgetForm__input} value={poolCurrency} onChange={(e) => onPoolCurrencyChange(e.target.value)}>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className={styles.budgetForm__fieldset}>
        <legend>Financiero</legend>
        <div className={styles.budgetForm__grid2}>
          <label className={styles.budgetForm__label}>Moneda
            <select className={styles.budgetForm__input} value={currency} onChange={(e) => onCurrencyChange(e.target.value)}>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label className={styles.budgetForm__label}>Cotización USD
            <input className={styles.budgetForm__input} type="number" value={usdRate} onChange={(e) => onUsdRateChange(Number(e.target.value))} />
          </label>
          <label className={styles.budgetForm__label}>Descuento
            <input className={styles.budgetForm__input} type="number" value={discountPct} onChange={(e) => onDiscountPctChange(Number(e.target.value))} min="0" />
          </label>
          <label className={styles.budgetForm__label}>Tipo de Descuento
            <select className={styles.budgetForm__input} value={discountType} onChange={(e) => onDiscountTypeChange(e.target.value)}>
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="fijo">Fijo ($)</option>
            </select>
          </label>
          <label className={styles.budgetForm__label}>Transporte
            <input className={styles.budgetForm__input} type="number" value={transport} onChange={(e) => onTransportChange(Number(e.target.value))} />
          </label>
          <label className={styles.budgetForm__label}>Instalación
            <input className={styles.budgetForm__input} type="number" value={installation} onChange={(e) => onInstallationChange(Number(e.target.value))} />
          </label>
          <label className={styles.budgetForm__label}>Seña recibida
            <input className={styles.budgetForm__input} type="number" value={depositReceived} onChange={(e) => onDepositReceivedChange(Number(e.target.value))} />
          </label>
          <label className={styles.budgetForm__label}>Moneda seña
            <select className={styles.budgetForm__input} value={depositCurrency} onChange={(e) => onDepositCurrencyChange(e.target.value)}>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label className={styles.budgetForm__label}>Cuotas
            <input className={styles.budgetForm__input} type="number" value={installments} onChange={(e) => onInstallmentsChange(Number(e.target.value))} min="1" />
          </label>
          <label className={styles.budgetForm__label}>Recargo por Tarjeta %
            <input className={styles.budgetForm__input} type="number" value={cardSurchargePct} onChange={(e) => onCardSurchargePctChange(Number(e.target.value))} min="0" step="0.1" />
          </label>
        </div>
        <div className={styles.budgetForm__totals}>
          <span>Subtotal: $ {subtotalTotal.toFixed(2)}</span>
          {discountAmt > 0 && <span>Desc.: -$ {discountAmt.toFixed(2)}</span>}
          {cardSurcharge > 0 && <span>Recargo: +$ {cardSurcharge.toFixed(2)}</span>}
          <span>Total: $ {totalArs.toFixed(2)}</span>
          {currency === "ARS" && <span>USD: US$ {totalUsd.toFixed(2)}</span>}
          <span>Saldo: $ {balanceDue.toFixed(2)}</span>
        </div>
      </fieldset>

      <fieldset className={styles.budgetForm__fieldset}>
        <legend>Información comercial</legend>
        <div className={styles.budgetForm__grid2}>
          <label className={styles.budgetForm__label}>Forma de pago
            <select className={styles.budgetForm__input} value={paymentMethod} onChange={(e) => onPaymentMethodChange(e.target.value)}>
              <option value="">Seleccionar...</option>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.name}>{pm.label}</option>
              ))}
            </select>
          </label>
          <label className={styles.budgetForm__label}>Validez (días)
            <input className={styles.budgetForm__input} type="number" value={validityDays} onChange={(e) => onValidityDaysChange(Number(e.target.value))} />
          </label>
          <label className={styles.budgetForm__label}>Entrega aprox.
            <input className={styles.budgetForm__input} value={estimatedDelivery} onChange={(e) => onEstimatedDeliveryChange(e.target.value)} />
          </label>
          <label className={styles.budgetForm__label}>Fecha estimada
            <input className={styles.budgetForm__input} type="date" value={estimatedDate} onChange={(e) => onEstimatedDateChange(e.target.value)} />
          </label>
        </div>
      </fieldset>
    </>
  );
}
