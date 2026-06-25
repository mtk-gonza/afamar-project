import { useState } from "react";
import { Search } from "lucide-react";
import { api } from "../../api/client";
import { useNotify } from "../../context/NotificationContext";
import { useReferences } from "../../context/ReferencesContext";
import styles from "./DailyCashPage.module.css";

const FOLDER_STATUS_MAP: Record<string, string> = {
  MEDICION: "Medición", TALLER: "Taller", TERMINADA: "Terminada", ENTREGADA: "Entregada",
};

function formatCurrency(n: number): string {
  return "$ " + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Props {
  date: string;
  onClose: () => void;
  onSaved: () => void;
}

export function CashIncomeFormModal({ date, onClose, onSaved }: Props) {
  const notify = useNotify();
  const { paymentMethods } = useReferences();
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]?.name || "Efectivo");
  const [folderStatus, setFolderStatus] = useState("Medición");
  const [orderNumber, setOrderNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderTotal, setOrderTotal] = useState<number | null>(null);

  const [orderSearch, setOrderSearch] = useState("");
  const [orderResults, setOrderResults] = useState<any[]>([]);
  const [showOrderSearch, setShowOrderSearch] = useState(false);

  const searchOrders = async (q: string) => {
    setOrderSearch(q);
    if (q.length < 2) { setOrderResults([]); return; }
    try {
      const res = await api.searchWorkOrders(q);
      setOrderResults(res as any[] || []);
    } catch { setOrderResults([]); }
  };

  const selectOrder = (order: any) => {
    setOrderId(order.id);
    setOrderNumber(order.number || order.numero);
    setClientName(order.snapshot_name || order.cliente_nombre || "");
    setAmount(order.total || "");
    setFolderStatus(FOLDER_STATUS_MAP[order.status] || order.status || "Medición");
    setOrderTotal(order.total || null);
    setShowOrderSearch(false);
    setOrderSearch("");
    setOrderResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    try {
      await api.createCashMovement({
        date,
        type: "INCOME",
        amount: Number(amount),
        description: orderNumber ? `Pago ${orderNumber} - ${clientName}` : `Ingreso manual - ${clientName || ""}`,
        payment_method: paymentMethod,
        folder_status: folderStatus,
        order_id: orderId,
        order_number: orderNumber,
        order_total: orderTotal,
        client_name: clientName,
      });
      onSaved();
    } catch {
      notify("Error al registrar ingreso", "error");
    }
  };

  return (
    <div className={styles["cash__modal-overlay"]} onClick={onClose}>
      <div className={styles["cash__modal"]} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles["cash__modal-title"]}>Agregar Ingreso</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles["cash__form-group"]}>
            <label>Vincular a Orden</label>
            <div style={{ position: "relative" }}>
              <input className={styles["cash__input"]} placeholder="Buscar orden..."
                value={orderSearch} onChange={(e) => searchOrders(e.target.value)}
                onFocus={() => setShowOrderSearch(true)} />
              <Search size={16} className={styles["cash__search-icon"]} />
              <button type="button" className="btn btn-outline"
                onClick={() => { setShowOrderSearch(false); setOrderSearch(""); setOrderResults([]); }}>Limpiar</button>
            </div>
            {showOrderSearch && orderResults.length > 0 && (
              <div className={styles["cash__search-results"]}>
                {orderResults.map((o: any) => (
                  <div key={o.id} className={styles["cash__search-item"]} onClick={() => selectOrder(o)}>
                    <strong>{o.number || o.numero}</strong> — {o.snapshot_name || o.cliente_nombre || "Sin cliente"}
                    <span style={{ float: "right", color: "#64748b" }}>{formatCurrency(o.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {orderNumber && (
            <div className={styles["cash__orden-info"]}>
              Orden: <strong>{orderNumber}</strong>
              {orderTotal && (
                <div>Total: {formatCurrency(orderTotal)} | Saldo: <strong>{formatCurrency(Math.max(0, orderTotal - Number(amount || 0)))}</strong></div>
              )}
            </div>
          )}

          <div className={styles["cash__form-row"]}>
            <div className={styles["cash__form-group"]}>
              <label>Cliente</label>
              <input className={styles["cash__input"]} value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div className={styles["cash__form-group"]}>
              <label>Monto *</label>
              <input className={styles["cash__input"]} type="number" step="0.01" min="0" required
                value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>

          <div className={styles["cash__form-row"]}>
            <div className={styles["cash__form-group"]}>
              <label>Forma de Pago</label>
              <select className={styles["cash__input"]} value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}>
                {paymentMethods.map((pm) => <option key={pm.id} value={pm.name}>{pm.label}</option>)}
              </select>
            </div>
            <div className={styles["cash__form-group"]}>
              <label>Estado Carpeta</label>
              <div className={styles["cash__input-static"]}>
                {folderStatus || "Sin orden vinculada"}
              </div>
            </div>
          </div>

          <div className={styles["cash__modal-actions"]}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-success">Registrar Ingreso</button>
          </div>
        </form>
      </div>
    </div>
  );
}
