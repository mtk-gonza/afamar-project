import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useNotify } from "../../context/NotificationContext";
import { ErrorBlock } from "../../components/ui/ErrorBlock";
import { FormActions } from "../../components/ui/FormActions";
import type { WorkOrder, Client, Material, MaterialColor, MaterialThickness, AppOption, PoolStock, SketchPage } from "../../types";
import type { WoItemRow } from "./WoFormItemsGrid";
import { WoFormBasic } from "./WoFormBasic";
import { WoFormSpecs } from "./WoFormSpecs";
import { WoFormItemsGrid } from "./WoFormItemsGrid";
import { WoFormObservations } from "./WoFormObservations";
import { WoFormFinancial } from "./WoFormFinancial";
import { WoFormSnapshot } from "./WoFormSnapshot";
import styles from "./WorkOrderForm.module.css";

interface FormState {
  client_id: number;
  client_name: string; client_phone: string; client_email: string; client_address: string;
  status: string; material: string; color: string; thickness: string; bacha: string; anafe: string;
  currency: string; usd_rate: number;
  subtotal: number; transport: number; installation: number; discount: number; total: number;
  subtotal_usd: number; transport_usd: number; total_usd: number;
  deposit_received: number; deposit_currency: string; deposit_usd: number;
  balance_due: number; balance_due_usd: number; balance_paid: boolean;
  payment_method: string; installments: number;
  priority: string; delivery_date: string; notes: string;
  fabrication_details: string; budgeted_details: string;
  design_observations: string; important_observations: string;
  pool_id: number; pool_price: number; pool_currency: string;
  snapshot_name: string; snapshot_phone: string; snapshot_email: string; snapshot_address: string;
}

let _fabKey = 1;
const fabKey = () => _fabKey++;
const emptyFabItem = (): WoItemRow => ({ _key: fabKey(), concept: "", detail: "", m2: 0, material: "" });

const INITIAL_FORM: FormState = {
  client_id: 0, client_name: "", client_phone: "", client_email: "", client_address: "",
  status: "measurement", material: "", color: "", thickness: "", bacha: "", anafe: "",
  currency: "ARS", usd_rate: 0,
  subtotal: 0, transport: 0, installation: 0, discount: 0, total: 0,
  subtotal_usd: 0, transport_usd: 0, total_usd: 0,
  deposit_received: 0, deposit_currency: "ARS", deposit_usd: 0,
  balance_due: 0, balance_due_usd: 0, balance_paid: false,
  payment_method: "", installments: 1,
  priority: "normal", delivery_date: "", notes: "",
  fabrication_details: "", budgeted_details: "",
  design_observations: "", important_observations: "",
  pool_id: 0, pool_price: 0, pool_currency: "ARS",
  snapshot_name: "", snapshot_phone: "", snapshot_email: "", snapshot_address: "",
};

export function WorkOrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useNotify();
  const isEdit = Boolean(id);
  const mounted = useRef(true);

  const [clients, setClients] = useState<Client[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [colors, setColors] = useState<MaterialColor[]>([]);
  const [thicknesses, setThicknesses] = useState<MaterialThickness[]>([]);
  const [bachaTypes, setBachaTypes] = useState<AppOption[]>([]);
  const [anafeTypes, setAnafeTypes] = useState<AppOption[]>([]);
  const [pools, setPools] = useState<PoolStock[]>([]);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [nextNumber, setNextNumber] = useState("");
  const [sketchPages, setSketchPages] = useState<SketchPage[]>([]);
  const [digitalSignature, setDigitalSignature] = useState<string | null>(null);
  const [fabItems, setFabItems] = useState<WoItemRow[]>([emptyFabItem()]);
  const [budgetedItems, setBudgetedItems] = useState<WoItemRow[]>([emptyFabItem()]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
    const results = await Promise.allSettled([
      api.getClients().then(setClients),
      api.getMaterials().then(setMaterials),
      api.getColors().then(setColors),
      api.getThicknesses().then(setThicknesses),
      api.getOptions("bacha_type").then(setBachaTypes),
      api.getOptions("anafe_type").then(setAnafeTypes),
      api.getPoolStock().then(setPools),
    ]);
    const errors = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    if (errors.length > 0) {
      const msg = "Error al cargar datos del formulario";
      notify(msg, "error");
      if (mounted.current) setDataError(msg);
    }
    if (mounted.current) setDataLoading(false);
  }, [notify]);

  useEffect(() => {
    mounted.current = true;
    loadData();
    api.getNextWorkOrderNumber().then((res) => {
      if (mounted.current) setNextNumber(res.number);
    }).catch(() => {});
    if (id) {
      api.getWorkOrder(Number(id)).then((o: WorkOrder) => {
        if (!mounted.current) return;
        setForm({
          client_id: o.client_id,
          client_name: "", client_phone: "", client_email: "", client_address: "",
          status: o.status, material: o.material || "", color: o.color || "",
          thickness: o.thickness || "", bacha: o.bacha || "", anafe: o.anafe || "",
          currency: o.currency, usd_rate: o.usd_rate,
          subtotal: o.subtotal, transport: o.transport, installation: o.installation,
          discount: o.discount, total: o.total,
          subtotal_usd: o.subtotal_usd, transport_usd: o.transport_usd, total_usd: o.total_usd,
          deposit_received: o.deposit_received, deposit_currency: o.deposit_currency, deposit_usd: o.deposit_usd,
          balance_due: o.balance_due, balance_due_usd: o.balance_due_usd, balance_paid: o.balance_paid,
          payment_method: o.payment_method || "", installments: o.installments,
          priority: o.priority, delivery_date: o.delivery_date || "", notes: o.notes || "",
          fabrication_details: o.fabrication_details || "", budgeted_details: o.budgeted_details || "",
          design_observations: o.design_observations || "", important_observations: o.important_observations || "",
          pool_id: o.pool_id || 0, pool_price: o.pool_price, pool_currency: o.pool_currency,
          snapshot_name: o.snapshot_name || "", snapshot_phone: o.snapshot_phone || "",
          snapshot_email: o.snapshot_email || "", snapshot_address: o.snapshot_address || "",
        });
        if (o.digital_signature) setDigitalSignature(o.digital_signature);
        try {
          const parsed = JSON.parse(o.fabrication_details || "[]");
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFabItems(parsed.map((i: any) => ({ _key: fabKey(), concept: i.concept || "", detail: i.detail || "", m2: i.m2 || 0, material: i.material || "" })));
          }
        } catch {}
        try {
          const parsed = JSON.parse(o.budgeted_details || "[]");
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBudgetedItems(parsed.map((i: any) => ({ _key: fabKey(), concept: i.concept || "", detail: i.detail || "", m2: i.m2 || 0, material: i.material || "" })));
          }
        } catch {}
      }).catch(() => notify("Error al cargar la orden de trabajo", "error"));
    }
    return () => { mounted.current = false; };
  }, [id, loadData, notify]);

  const handleFormChange = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleClientChange = (clientId: number, _clientName: string) => {
    setForm((prev) => ({ ...prev, client_id: clientId }));
  };

  const updateFabItem = (idx: number, field: keyof Omit<WoItemRow, "_key">, value: string | number) => {
    setFabItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };
  const addFabItem = () => setFabItems([...fabItems, emptyFabItem()]);
  const removeFabItem = (idx: number) => fabItems.length > 1 && setFabItems(fabItems.filter((_, i) => i !== idx));

  const updateBudgetedItem = (idx: number, field: keyof Omit<WoItemRow, "_key">, value: string | number) => {
    setBudgetedItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };
  const addBudgetedItem = () => setBudgetedItems([...budgetedItems, emptyFabItem()]);
  const removeBudgetedItem = (idx: number) => budgetedItems.length > 1 && setBudgetedItems(budgetedItems.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id && !form.client_name) {
      notify("Seleccioná un cliente o ingresá un nombre", "error");
      return;
    }
    setSaving(true);
    const onlyFab = fabItems.filter((i) => i.concept || i.detail);
    const onlyBud = budgetedItems.filter((i) => i.concept || i.detail);
    const payload = {
      ...form,
      digital_signature: digitalSignature,
      fabrication_details: onlyFab.length > 0 ? JSON.stringify(onlyFab.map(({ _key: _, ...i }) => i)) : form.fabrication_details,
      budgeted_details: onlyBud.length > 0 ? JSON.stringify(onlyBud.map(({ _key: _, ...i }) => i)) : form.budgeted_details,
    };
    try {
      if (isEdit) {
        await api.updateWorkOrder(Number(id), payload);
      } else {
        await api.createWorkOrder(payload);
      }
      navigate("/admin/work-orders");
    } catch {
      notify("Error al guardar la orden de trabajo", "error");
    } finally {
      setSaving(false);
    }
  };

  if (dataError && !dataLoading) {
    return (
      <div className={styles.form}>
        <h2 className={styles.form__title}>{isEdit ? "Editar Orden" : "Nueva Orden de Trabajo"}</h2>
        <ErrorBlock message={dataError} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <h2 className={styles.form__title}>
        {isEdit ? "Editar Orden" : "Nueva Orden de Trabajo"}
        {nextNumber && !isEdit && <span className={styles.form__nextNumber}> — Nº {nextNumber}</span>}
      </h2>
      <form className={styles.form__grid} onSubmit={handleSubmit}>
        <WoFormBasic
          clientId={form.client_id}
          clientName={form.client_name} clientPhone={form.client_phone}
          clientEmail={form.client_email} clientAddress={form.client_address}
          status={form.status} priority={form.priority} deliveryDate={form.delivery_date}
          clients={clients} dataLoading={dataLoading} isEdit={isEdit}
          onClientChange={handleClientChange}
          onClientFieldChange={(field, v) => handleFormChange(field, v)}
          onStatusChange={(s) => handleFormChange("status", s)}
          onPriorityChange={(v) => handleFormChange("priority", v)}
          onDeliveryDateChange={(v) => handleFormChange("delivery_date", v)}
        />

        <WoFormSpecs
          material={form.material} color={form.color} thickness={form.thickness}
          bacha={form.bacha} anafe={form.anafe}
          materials={materials} colors={colors} thicknesses={thicknesses}
          bachaTypes={bachaTypes} anafeTypes={anafeTypes}
          dataLoading={dataLoading}
          onChange={handleFormChange}
        />

        <WoFormItemsGrid
          title="Detalles presupuestados"
          items={budgetedItems}
          onUpdate={updateBudgetedItem} onAdd={addBudgetedItem} onRemove={removeBudgetedItem}
        />

        <WoFormItemsGrid
          title="Detalles de fabricación"
          items={fabItems}
          onUpdate={updateFabItem} onAdd={addFabItem} onRemove={removeFabItem}
        />

        <WoFormObservations
          designObservations={form.design_observations}
          importantObservations={form.important_observations}
          sketchPages={sketchPages} digitalSignature={digitalSignature}
          onDesignChange={(v) => handleFormChange("design_observations", v)}
          onImportantChange={(v) => handleFormChange("important_observations", v)}
          onSketchChange={setSketchPages}
          onSignatureChange={setDigitalSignature}
        />

        <WoFormFinancial
          currency={form.currency} usdRate={form.usd_rate}
          poolId={form.pool_id} poolPrice={form.pool_price} poolCurrency={form.pool_currency} pools={pools}
          subtotal={form.subtotal} transport={form.transport} installation={form.installation}
          discount={form.discount} total={form.total}
          subtotalUsd={form.subtotal_usd} transportUsd={form.transport_usd} totalUsd={form.total_usd}
          depositReceived={form.deposit_received} depositCurrency={form.deposit_currency} depositUsd={form.deposit_usd}
          balanceDue={form.balance_due} balanceDueUsd={form.balance_due_usd} balancePaid={form.balance_paid}
          paymentMethod={form.payment_method} installments={form.installments}
          dataLoading={dataLoading}
          onChange={handleFormChange}
        />

        <WoFormSnapshot
          name={form.snapshot_name} phone={form.snapshot_phone}
          email={form.snapshot_email} address={form.snapshot_address}
          notes={form.notes}
          onChange={handleFormChange}
        />

        <FormActions loading={saving || dataLoading} />
      </form>
    </div>
  );
}
