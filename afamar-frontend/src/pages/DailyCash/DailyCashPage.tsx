import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Banknote, Lock, Plus, Printer, Trash2, Wallet } from "lucide-react";
import { api } from "@/api/client";
import { useNotify } from "@/context/NotificationContext";
import { useGet } from "@/shared/api/hooks";
import { CashIncomeFormModal } from "./CashIncomeFormModal";
import { CashExpenseFormModal } from "./CashExpenseFormModal";
import type { CashMovement, DailyCash } from "@/types";
import styles from "./DailyCashPage.module.css";

function formatCurrency(n: number): string {
  return "$ " + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function DailyCashPage() {
  const notify = useNotify();
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [previousBalance, setPreviousBalance] = useState(0);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const [editingBalance, setEditingBalance] = useState(false);

  const [showIncome, setShowIncome] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showClose, setShowClose] = useState(false);
  const [closeNotes, setCloseNotes] = useState("");

  const { loading, load: loadCash } = useGet(["dailyCash", date], async () => {
    try {
      const res = await api.getDailyCash(date);
      if (res) {
        const c = res as unknown as DailyCash;
        setPreviousBalance(c.previous_balance ?? 0);
        setMovements(c.movements || []);
        setIsClosed(c.is_closed || false);
        if (!c.is_closed && c.movements.length === 0 && !c.previous_balance) {
          const prev = new Date(date);
          prev.setDate(prev.getDate() - 1);
          const prevStr = prev.toISOString().split("T")[0];
          try {
            const prevRes = await api.getDailyCash(prevStr);
            const prevC = prevRes as unknown as DailyCash;
            const prevBal = prevC.current_balance || 0;
            if (prevBal) {
              await api.updateCashPreviousBalance(date, prevBal);
              setPreviousBalance(prevBal);
            }
          } catch { /* no cash from previous day */ }
        }
      }
    } catch {
      setMovements([]);
      setIsClosed(false);
    }
    return null;
  });

  const handleSavePreviousBalance = async () => {
    try {
      await api.updateCashPreviousBalance(date, previousBalance);
      setEditingBalance(false);
      await loadCash();
    } catch {
      notify("Error al guardar saldo anterior", "error");
    }
  };

  const handleDeleteMovement = async () => {
    if (!deleteId) return;
    try {
      await api.deleteCashMovement(deleteId);
      setDeleteId(null);
      await loadCash();
    } catch {
      notify("Error al eliminar movimiento", "error");
    }
  };

  const handleCloseCash = async () => {
    try {
      await api.closeDailyCash(date, closeNotes || undefined);
      setShowClose(false);
      setCloseNotes("");
      await loadCash();
    } catch {
      notify("Error al cerrar la caja", "error");
    }
  };

  const handlePrint = () => window.print();

  const incomeMovements = movements.filter((m) => m.type === "INCOME");
  const expenseMovements = movements.filter((m) => m.type === "EXPENSE");
  const totalIncome = incomeMovements.reduce((s, m) => s + (m.amount || 0), 0);
  const totalExpenses = expenseMovements.reduce((s, m) => s + (m.amount || 0), 0);
  const sum = (previousBalance || 0) + totalIncome;
  const currentBalance = sum - totalExpenses;
  const cashIncome = incomeMovements.filter((m) => (m.payment_method || "").toUpperCase() === "CASH").reduce((s, m) => s + (m.amount || 0), 0);
  const bankTransferExpenses = expenseMovements.filter((m) => m.expense_type === "BANK_TRANSFER").reduce((s, m) => s + (m.amount || 0), 0);
  const realCash = (previousBalance || 0) + cashIncome - (totalExpenses - bankTransferExpenses);
  const isToday = date === today;

  return (
    <div>
      <div id="print-area">
        <div className={styles["cash__header"]}>
          <h1 className={styles["cash__title"]}>Caja Diaria</h1>
          <div className={styles["cash__actions"]}>
            <input type="date" className={styles["cash__input"]} value={date} onChange={(e) => setDate(e.target.value)} />
            {!isToday && (
              <button className="btn btn-outline" onClick={() => setDate(today)}>Hoy</button>
            )}
            {isToday && !isClosed && (
              <button className="btn btn-danger" onClick={() => setShowClose(true)}>
                <Lock size={14} /> Cerrar Caja
              </button>
            )}
            {isClosed && <span className="badge badge-finished">Cerrada</span>}
            <button className="btn btn-outline" onClick={handlePrint}>
              <Printer size={14} /> Imprimir
            </button>
          </div>
        </div>

        <div className={styles["cash__saldo-anterior"]}>
          <Wallet size={22} />
          <span className={styles["cash__saldo-label"]}>Saldo Anterior:</span>
          {editingBalance ? (
            <div className={styles["cash__saldo-edit"]}>
              <input type="number" step="0.01" className={styles["cash__input"]}
                value={previousBalance} onChange={(e) => setPreviousBalance(Number(e.target.value))} autoFocus />
              <button className="btn btn-primary" onClick={handleSavePreviousBalance}>Guardar</button>
              <button className="btn btn-outline" onClick={() => { setEditingBalance(false); loadCash(); }}>Cancelar</button>
            </div>
          ) : (
            <div className={styles["cash__saldo-display"]}>
              <span className={styles["cash__saldo-monto"]}>{formatCurrency(previousBalance)}</span>
              {!isClosed && (
                <button className="btn btn-outline" onClick={() => setEditingBalance(true)}>Editar</button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <p className={styles["cash__loading"]}>Cargando...</p>
        ) : (
          <>
            <div className={styles["cash__grid"]}>
              <div className={styles["cash__col"]}>
                <div className={styles["cash__col-header"]}>
                  <h3 className={styles["cash__col-title"]} style={{ color: "#16a34a" }}>
                    <ArrowUpCircle size={20} /> Entradas (Ingresos)
                  </h3>
                  <button className="btn btn-success" disabled={isClosed} onClick={() => setShowIncome(true)}>
                    <Plus size={14} /> Agregar Ingreso
                  </button>
                </div>
                <table className={styles["cash__table"]}>
                  <thead>
                    <tr>
                      <th>N° Orden</th><th>Cliente</th><th>Monto</th><th>Saldo Restante</th><th>Pago</th><th>Carpeta</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeMovements.length === 0 ? (
                      <tr><td colSpan={7} className={styles["cash__empty"]}>Sin ingresos registrados</td></tr>
                    ) : (
                      incomeMovements.map((m) => (
                        <tr key={m.id}>
                          <td className={styles["cash__mono"]}>{m.order_number || "-"}</td>
                          <td>{m.client_name || "-"}</td>
                          <td className={styles["cash__ingreso"]}>{formatCurrency(m.amount)}</td>
                          <td className={m.remaining_balance && m.remaining_balance > 0 ? styles["cash__pendiente"] : styles["cash__pagado"]}>
                            {m.remaining_balance !== null && m.remaining_balance !== undefined ? formatCurrency(m.remaining_balance) : "-"}
                          </td>
                          <td>
                            <span className={`badge ${m.payment_method === "Efectivo" ? "badge-approved" : m.payment_method === "Transferencia" ? "badge-production" : "badge-pending"}`}>
                              {m.payment_method || "-"}
                            </span>
                          </td>
                          <td>{m.folder_status ? <span className="badge badge-pending">{m.folder_status}</span> : "-"}</td>
                          <td>
                            <button className={styles["cash__delete-btn"]} onClick={() => setDeleteId(m.id)} title="Eliminar">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className={styles["cash__col"]}>
                <div className={styles["cash__col-header"]}>
                  <h3 className={styles["cash__col-title"]} style={{ color: "#dc2626" }}>
                    <ArrowDownCircle size={20} /> Salidas (Egresos)
                  </h3>
                  <button className="btn btn-danger" disabled={isClosed} onClick={() => setShowExpense(true)}>
                    <Plus size={14} /> Agregar Egreso
                  </button>
                </div>
                <table className={styles["cash__table"]}>
                  <thead>
                    <tr>
                      <th>Concepto</th><th>Monto</th><th>Tipo</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseMovements.length === 0 ? (
                      <tr><td colSpan={4} className={styles["cash__empty"]}>Sin egresos registrados</td></tr>
                    ) : (
                      expenseMovements.map((m) => (
                        <tr key={m.id}>
                          <td>{m.description || "-"}</td>
                          <td className={styles["cash__egreso"]}>{formatCurrency(m.amount)}</td>
                          <td>
                            <span className={`badge ${m.expense_type === "EXPENSE" ? "badge-rejected" : "badge-production"}`}>
                              {m.expense_type === "EXPENSE" ? "Gasto" : "Transf. Banco"}
                            </span>
                          </td>
                          <td>
                            <button className={styles["cash__delete-btn"]} onClick={() => setDeleteId(m.id)} title="Eliminar">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles["cash__totals"]}>
              <div className={styles["cash__total-card"]}>
                <div className={styles["cash__total-label"]}>Suma</div>
                <div className={styles["cash__total-value"]}>{formatCurrency(sum)}</div>
                <div className={styles["cash__total-desc"]}>Saldo Ant. + Ingresos</div>
              </div>
              <div className={styles["cash__total-card"]}>
                <div className={styles["cash__total-label"]}>Total Salidas</div>
                <div className={styles["cash__total-value"]} style={{ color: "#dc2626" }}>{formatCurrency(totalExpenses)}</div>
                <div className={styles["cash__total-desc"]}>Suma de egresos del día</div>
              </div>
              <div className={styles["cash__total-card"]}>
                <div className={styles["cash__total-label"]}>Saldo Actual</div>
                <div className={styles["cash__total-value"]} style={{ color: "#1e40af" }}>{formatCurrency(currentBalance)}</div>
                <div className={styles["cash__total-desc"]}>Suma - Salidas</div>
              </div>
              <div className={`${styles["cash__total-card"]} ${styles["cash__total-card--highlight"]}`}>
                <div className={styles["cash__total-label"]} style={{ color: "#166534" }}><Banknote size={16} /> Caja del Día</div>
                <div className={styles["cash__total-value"]} style={{ color: "#16a34a", fontSize: 26 }}>{formatCurrency(realCash)}</div>
                <div className={styles["cash__total-desc"]} style={{ color: "#166534" }}>Efectivo real (excluye TB)</div>
              </div>
            </div>
          </>
        )}
      </div>

      {showIncome && (
        <CashIncomeFormModal date={date} onClose={() => setShowIncome(false)} onSaved={() => { setShowIncome(false); loadCash(); }} />
      )}

      {showExpense && (
        <CashExpenseFormModal date={date} onClose={() => setShowExpense(false)} onSaved={() => { setShowExpense(false); loadCash(); }} />
      )}

      {deleteId && (
        <div className={styles["cash__modal-overlay"]} onClick={() => setDeleteId(null)}>
          <div className={styles["cash__modal"]} style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles["cash__modal-title"]}>Eliminar movimiento</h2>
            <p>¿Estás seguro de eliminar este movimiento de caja?</p>
            <div className={styles["cash__modal-actions"]}>
              <button className="btn btn-outline" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDeleteMovement}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {showClose && (
        <div className={styles["cash__modal-overlay"]} onClick={() => setShowClose(false)}>
          <div className={styles["cash__modal"]} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles["cash__modal-title"]}>Cerrar Caja del Día</h2>
            <p>Al cerrar se congelarán los totales del día <strong>{date}</strong>.</p>
            <div className={styles["cash__form-group"]}>
              <label>Observaciones (opcional)</label>
              <textarea className={styles["cash__input"]} rows={4} placeholder="Notas de la jornada..."
                value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} />
            </div>
            <div className={styles["cash__modal-actions"]}>
              <button className="btn btn-outline" onClick={() => { setShowClose(false); setCloseNotes(""); }}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleCloseCash}>
                <Lock size={14} /> Cerrar Caja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
