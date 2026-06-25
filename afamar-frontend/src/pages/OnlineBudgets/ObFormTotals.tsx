import { useNavigate } from "react-router-dom";
import { FormActions } from "../../components/ui/FormActions";
import styles from "./OnlineBudgets.module.css";

interface Props {
  totalArs: number;
  totalUsd: number;
  totalConsolidado: number;
  usdRate: number;
  hayUSD: boolean;
  isEdit: boolean;
  dataLoading: boolean;
  saving: boolean;
  onWhatsAppExport: () => void;
  onConvertToWorkOrder: () => void;
}

export function ObFormTotals({
  totalArs, totalUsd, totalConsolidado, usdRate, hayUSD,
  isEdit, dataLoading, saving,
  onWhatsAppExport, onConvertToWorkOrder,
}: Props) {
  const navigate = useNavigate();

  return (
    <>
      <fieldset className={styles.onlineBudgets__fieldset}>
        <legend>Totales</legend>
        <div className={styles.onlineBudgets__totalsRow}>
          <div className={styles.onlineBudgets__totalBox}>
            <span className={styles.onlineBudgets__totalLabel}>TOTAL NETO ARS</span>
            <span className={styles.onlineBudgets__totalValue}>$ {totalArs.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span>
          </div>
          {hayUSD && (
            <div className={styles.onlineBudgets__totalBox}>
              <span className={styles.onlineBudgets__totalLabel}>TOTAL NETO USD</span>
              <span className={styles.onlineBudgets__totalValue} style={{ color: "#059669" }}>USD {totalUsd.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className={styles.onlineBudgets__totalBoxConsolidado}>
            <span className={styles.onlineBudgets__totalLabel} style={{ color: "rgba(255,255,255,0.8)" }}>TOTAL CONSOLIDADO</span>
            {hayUSD && <span className={styles.onlineBudgets__totalSubtext}>(ARS + USD x ${usdRate.toLocaleString("es-AR")})</span>}
            <span className={styles.onlineBudgets__totalValue} style={{ fontSize: 22 }}>$ {totalConsolidado.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </fieldset>

      <div className={styles.onlineBudgets__actions}>
        <button type="button" className={styles["onlineBudgets__actionBtn--whatsapp"]} onClick={onWhatsAppExport} disabled={dataLoading}>
          Exportar para WhatsApp
        </button>
        {isEdit && (
          <button type="button" className={styles["onlineBudgets__actionBtn--convert"]} onClick={onConvertToWorkOrder} disabled={dataLoading}>
            CONVERTIR A OT
          </button>
        )}
        <div style={{ flex: 1 }} />
        <FormActions loading={saving || dataLoading} submitLabel="Guardar" onCancel={() => navigate("/admin/online-budgets")} />
      </div>
    </>
  );
}
