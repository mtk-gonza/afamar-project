import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useNotify } from "../../context/NotificationContext";
import { useConfirm } from "../../components/ui/useConfirm";
import { PageHeader } from "../../components/ui/PageHeader";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorBlock } from "../../components/ui/ErrorBlock";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import type { OnlineBudget } from "../../types";
import styles from "./OnlineBudgets.module.css";

export function OnlineBudgets() {
  const notify = useNotify();
  const { confirm, dialog } = useConfirm();
  const navigate = useNavigate();
  const [items, setItems] = useState<OnlineBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ob = await api.getOnlineBudgets();
      setItems(ob);
    } catch {
      setError("Error al cargar presupuestos online");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    if (!(await confirm("¿Eliminar presupuesto online?", "Eliminar", true))) return;
    try {
      await api.deleteOnlineBudget(id);
      notify("Presupuesto online eliminado", "success");
      load();
    } catch {
      notify("Error al eliminar", "error");
    }
  };

  const handleConvert = async (ob: OnlineBudget) => {
    if (!(await confirm(`¿Convertir ${ob.number} a Orden de Trabajo?`, "Convertir a OT", true))) return;
    try {
      const wo = await api.convertOnlineBudgetToWorkOrder(ob.id);
      notify(`Orden ${wo.number} creada`, "success");
      load();
    } catch (err: any) {
      notify(err.message || "Error al convertir", "error");
    }
  };

  const handleWhatsApp = async (ob: OnlineBudget) => {
    try {
      let itemsData: any[] = [];
      try { itemsData = JSON.parse(ob.items_data || "[]"); } catch { itemsData = []; }
      const meta = itemsData.find((i: any) => i && i._meta);
      const phone = meta?._meta?.phone || "";

      if (phone) {
        const msg = generarWhatsAppMessage(ob);
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, "_blank");
      } else {
        const msg = generarWhatsAppMessage(ob);
        await navigator.clipboard.writeText(msg);
        notify("Copiado al portapapeles", "success");
      }
    } catch {
      notify("Error al preparar WhatsApp", "error");
    }
  };

  return (
    <div className={styles.onlineBudgets}>
      <PageHeader title="Presupuestos Online">
        <button className={styles.onlineBudgets__addBtn} onClick={() => navigate("/admin/online-budgets/new")}>
          + Nuevo Online
        </button>
      </PageHeader>

      {loading && <LoadingSpinner />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState message="No hay presupuestos online." />}

      {!loading && !error && items.length > 0 && (
        <div className={styles.onlineBudgets__tableWrap}>
          <table className={styles.onlineBudgets__table}>
            <thead>
              <tr>
                <th>Número</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Total ARS</th>
                <th>Total USD</th>
                <th>Consolidado</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((ob) => (
                <tr key={ob.id}>
                  <td>{ob.number}</td>
                  <td>{ob.client_name || "-"}</td>
                  <td>{ob.work_type || "-"}</td>
                  <td>$ {ob.total_net_ars.toFixed(2)}</td>
                  <td>US$ {ob.total_net_usd.toFixed(2)}</td>
                  <td>$ {ob.total_consolidated.toFixed(2)}</td>
                  <td><StatusBadge status={ob.status} labels={{ ONLINE: "Online", ["CONVERTIDO A OT"]: "Convertido a OT" }} /></td>
                  <td>
                    <div className={styles.onlineBudgets__actionBtnGroup}>
                      <button type="button" className={styles["onlineBudgets__actionBtn--edit"]} onClick={() => navigate(`/admin/online-budgets/${ob.id}/edit`)}>Editar</button>
                      <button type="button" className={styles["onlineBudgets__actionBtn--wa"]} onClick={() => handleWhatsApp(ob)} title="Enviar por WhatsApp">WA</button>
                      <button type="button" className={styles["onlineBudgets__actionBtn--convert"]} onClick={() => handleConvert(ob)} disabled={ob.status !== "ONLINE"}>OT</button>
                      <button type="button" className={styles["onlineBudgets__actionBtn--danger"]} onClick={() => handleDelete(ob.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {dialog}
    </div>
  );
}

function generarWhatsAppMessage(ob: OnlineBudget): string {
  const L: string[] = [];
  L.push("AFAMAR - MARMOLES & GRANITOS");
  L.push("LA PLATA, BS AS");
  if (ob.client_name) L.push(`Cliente: ${ob.client_name}`);
  if (ob.work_type) L.push(`Obra: ${ob.work_type}`);
  if (ob.date) L.push(`Fecha: ${ob.date}`);
  L.push("");

  let itemsData: any[] = [];
  try { itemsData = JSON.parse(ob.items_data || "[]"); } catch { itemsData = []; }

  const itemsSinMeta = itemsData.filter((i: any) => i && !i._meta);
  const itemsUsd = itemsSinMeta.filter((i: any) => i.subtotal > 0 && i.moneda === "USD");
  const itemsArs = itemsSinMeta.filter((i: any) => i.subtotal > 0 && i.moneda === "ARS");

  if (itemsUsd.length) {
    L.push("Cotizado en DOLARES (USD):");
    itemsUsd.forEach((i: any) => {
      let t = `. ${i.detalle}`;
      if (i.es_unidad) t += ` | Cant: ${i.cantidad}`;
      else if (i.m2 > 0) t += ` | ${i.largo}x${i.ancho} = ${i.m2.toFixed(5)} m2`;
      t += ` | USD ${(i.precio_unitario || 0).toFixed(2)}/u = USD ${(i.subtotal || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
      L.push(t);
    });
    L.push("");
  }
  if (itemsArs.length) {
    L.push("Cotizado en PESOS (ARS):");
    itemsArs.forEach((i: any) => {
      let t = `. ${i.detalle}`;
      if (i.es_unidad) t += ` | Cant: ${i.cantidad}`;
      else if (i.m2 > 0) t += ` | ${i.largo}x${i.ancho} = ${i.m2.toFixed(5)} m2`;
      t += ` | $ ${(i.precio_unitario || 0).toFixed(2)}/u = $ ${(i.subtotal || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
      L.push(t);
    });
    L.push("");
  }
  L.push("==============================");
  if (ob.total_net_usd > 0) L.push(`TOTAL USD: USD ${ob.total_net_usd.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
  if (ob.total_net_ars > 0) L.push(`TOTAL ARS: $ ${ob.total_net_ars.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
  if (ob.total_net_usd > 0 && ob.usd_rate > 0) {
    L.push(`Dolar del dia: $${ob.usd_rate.toLocaleString("es-AR")}`);
    L.push(`TOTAL CONSOLIDADO: $ ${ob.total_consolidated.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`);
  }
  L.push("");
  L.push("Consultas al WhatsApp");
  return L.join("\n");
}
