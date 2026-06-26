import { useState } from "react";
import { api } from "../../api/client";
import { useNotify } from "../../context/NotificationContext";
import { t } from "../../utils/translate";
import styles from "./DailyCashPage.module.css";

const EXPENSE_TYPES = ["EXPENSE", "BANK_TRANSFER"];

interface Props {
  date: string;
  onClose: () => void;
  onSaved: () => void;
}

export function CashExpenseFormModal({ date, onClose, onSaved }: Props) {
  const notify = useNotify();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseType, setExpenseType] = useState("EXPENSE");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    try {
      await api.createCashMovement({
        date,
        type: "EXPENSE",
        amount: Number(amount),
        description,
        expense_type: expenseType,
      });
      onSaved();
    } catch {
      notify("Error al registrar egreso", "error");
    }
  };

  return (
    <div className={styles["cash__modal-overlay"]} onClick={onClose}>
      <div className={styles["cash__modal"]} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles["cash__modal-title"]}>Agregar Egreso</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles["cash__form-group"]}>
            <label>Concepto *</label>
            <input className={styles["cash__input"]} required placeholder="Ej: Nafta, Limpieza..."
              value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className={styles["cash__form-row"]}>
            <div className={styles["cash__form-group"]}>
              <label>Monto *</label>
              <input className={styles["cash__input"]} type="number" step="0.01" min="0" required
                value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className={styles["cash__form-group"]}>
              <label>Tipo</label>
              <select className={styles["cash__input"]} value={expenseType}
                onChange={(e) => setExpenseType(e.target.value)}>
                {EXPENSE_TYPES.map((et) => <option key={et} value={et}>{t(et)}</option>)}
              </select>
            </div>
          </div>
          <div className={styles["cash__modal-actions"]}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-danger">Registrar Egreso</button>
          </div>
        </form>
      </div>
    </div>
  );
}
