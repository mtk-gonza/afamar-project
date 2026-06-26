import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Banknote, ChevronDown, ChevronUp, Eye, Filter } from "lucide-react";
import { api } from "@/api/client";
import { useList } from "@/shared/api/hooks";
import type { DailyCash } from "@/types";
import styles from "./DailyCashPage.module.css";

function formatCurrency(n: number): string {
  return "$ " + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CashHistory() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [monthFilter, setMonthFilter] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [accumulatedBalances, setAccumulatedBalances] = useState<Record<string, number>>({});
  const { items: cashes, loading } = useList(["cashHistory", monthFilter], async () => {
    const data = await api.getCashHistory();
    let list = (data as unknown as DailyCash[]) || [];
    if (monthFilter) {
      list = list.filter((c) => c.date?.startsWith(monthFilter));
    }
    list.sort((a, b) => b.date.localeCompare(a.date));
    const acums: Record<string, number> = {};
    let running = 0;
    for (const c of [...list].reverse()) {
      running += (c.current_balance || 0);
      acums[c.date] = running;
    }
    setAccumulatedBalances(acums);
    return list;
  });

  return (
    <div>
      <div className={styles["cash__header"]}>
        <h1 className={styles["cash__title"]}>Historial de Cierres</h1>
        <div className={styles["cash__actions"]}>
          <Filter size={16} />
          <input type="month" className={styles["cash__input"]}
            style={{ width: 180 }}
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <p className={styles["cash__loading"]}>Cargando historial...</p>
      ) : cashes.length === 0 ? (
        <p className={styles["cash__empty"]} style={{ textAlign: "center", padding: "4rem", fontSize: "1rem" }}>
          No hay cierres registrados en este período.
        </p>
      ) : (
        <div className={styles["cash__historial-list"]}>
          {cashes.map((cash) => {
            const isOpen = expandedId === cash.id;
            const movs = cash.movements || [];
            const ingresos = movs.filter((m: any) => m.type === "INCOME");
            const egresos = movs.filter((m: any) => m.type === "EXPENSE");

            return (
              <div key={cash.id} className={styles["cash__historial-card"]}>
                <div className={styles["cash__historial-header"]}
                  onClick={() => setExpandedId(isOpen ? null : cash.id)}>
                  <div className={styles["cash__historial-fecha"]}>
                    <strong>{new Date(cash.date + "T12:00:00").toLocaleDateString("es-AR", {
                      weekday: "long", year: "numeric", month: "long", day: "numeric",
                    })}</strong>
                  </div>
                  <div className={styles["cash__historial-resumen"]}>
                    <span className={styles["cash__historial-stat"]}>
                      <ArrowUpCircle size={14} style={{ color: "#16a34a" }} />
                      {formatCurrency(ingresos.reduce((s: number, m: any) => s + (m.amount || 0), 0))}
                    </span>
                    <span className={styles["cash__historial-stat"]}>
                      <ArrowDownCircle size={14} style={{ color: "#dc2626" }} />
                      {formatCurrency(egresos.reduce((s: number, m: any) => s + (m.amount || 0), 0))}
                    </span>
                    <span className={styles["cash__historial-stat"]}>
                      <Banknote size={14} style={{ color: "#16a34a" }} />
                      <strong>{formatCurrency(cash.current_balance || 0)}</strong>
                    </span>
                    <span className={styles["cash__historial-stat"]}>
                      Acumulado: <strong>{formatCurrency(accumulatedBalances[cash.date] || 0)}</strong>
                    </span>
                  </div>
                  <div className={styles["cash__historial-toggle"]}>
                    <Eye size={16} />
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {isOpen && (
                  <div className={styles["cash__historial-detalle"]}>
                    <table className={styles["cash__table"]}>
                      <thead>
                        <tr>
                          <th>Tipo</th>
                          <th>Concepto</th>
                          <th>Monto</th>
                          <th>Forma Pago</th>
                          <th>Cliente</th>
                          <th>N° Orden</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movs.length === 0 ? (
                          <tr><td colSpan={6} className={styles["cash__empty"]}>Sin movimientos</td></tr>
                        ) : (
                          movs.map((m: any) => (
                            <tr key={m.id}>
                              <td>
                                <span className={`badge ${m.type === "INCOME" ? "badge-approved" : "badge-rejected"}`}>
                                  {m.type === "INCOME" ? "Ingreso" : "Egreso"}
                                </span>
                              </td>
                              <td>{m.description || "-"}</td>
                              <td className={m.type === "INCOME" ? styles["cash__ingreso"] : styles["cash__egreso"]}>
                                {formatCurrency(m.amount)}
                              </td>
                              <td>{m.payment_method || "-"}</td>
                              <td>{m.client_name || "-"}</td>
                              <td className={styles["cash__mono"]}>{m.order_number || "-"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    {cash.notes && (
                      <div className={styles["cash__observaciones"]}>
                        <strong>Observaciones:</strong> {cash.notes}
                      </div>
                    )}

                    <div className={styles["cash__totals"]} style={{ marginTop: "1rem" }}>
                      <div className={styles["cash__total-card"]}>
                        <div className={styles["cash__total-label"]}>Saldo Anterior</div>
                        <div className={styles["cash__total-value"]} style={{ fontSize: "1.25rem" }}>
                          {formatCurrency(cash.previous_balance || 0)}
                        </div>
                      </div>
                      <div className={styles["cash__total-card"]}>
                        <div className={styles["cash__total-label"]}>Total Ingresos</div>
                        <div className={styles["cash__total-value"]} style={{ fontSize: "1.25rem", color: "#16a34a" }}>
                          {formatCurrency(ingresos.reduce((s: number, m: any) => s + (m.amount || 0), 0))}
                        </div>
                      </div>
                      <div className={styles["cash__total-card"]}>
                        <div className={styles["cash__total-label"]}>Total Egresos</div>
                        <div className={styles["cash__total-value"]} style={{ fontSize: "1.25rem", color: "#dc2626" }}>
                          {formatCurrency(egresos.reduce((s: number, m: any) => s + (m.amount || 0), 0))}
                        </div>
                      </div>
                      <div className={`${styles["cash__total-card"]} ${styles["cash__total-card--highlight"]}`}>
                        <div className={styles["cash__total-label"]}>Saldo Final</div>
                        <div className={styles["cash__total-value"]} style={{ fontSize: "1.25rem", color: "#16a34a" }}>
                          {formatCurrency(cash.current_balance || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
