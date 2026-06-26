import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/api/client";
import { useNotify } from "@/context/NotificationContext";
import { useReferences } from "@/context/ReferencesContext";
import { ErrorBlock } from "@/components/ui/ErrorBlock";
import { FormActions } from "@/components/ui/FormActions";
import { useList, useGet } from "@/shared/api/hooks";
import type { Budget, Client, Material, MaterialColor, MaterialThickness, AppOption, PoolStock } from "@/types";
import type { ItemRow } from "./BudgetFormItems";
import type { AdicionalRow } from "./BudgetFormAdicionales";
import { BudgetFormClient } from "./BudgetFormClient";
import { BudgetFormSpecs } from "./BudgetFormSpecs";
import { BudgetFormItems } from "./BudgetFormItems";
import { BudgetFormAdicionales } from "./BudgetFormAdicionales";
import { BudgetFormFinancial } from "./BudgetFormFinancial";
import { BudgetFormObservations } from "./BudgetFormObservations";
import styles from "./BudgetForm.module.css";

let _nextKey = 1;
const key = () => _nextKey++;
const emptyItem = (sector = ""): ItemRow => ({ _key: key(), sector, description: "", quantity: 1, unit_price: 0, total: 0, length: 0, width: 0, m2: 0, price_m2: 0 });
const emptyAdicional = (): AdicionalRow => ({ _key: key(), concept: "", detail: "", quantity: 1, unit_price: 0, total: 0 });

export function BudgetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useNotify();
  const isEdit = Boolean(id);
  const numId = id ? Number(id) : null;
  const { paymentMethods } = useReferences();

  const [clients, setClients] = useState<Client[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [colors, setColors] = useState<MaterialColor[]>([]);
  const [thicknesses, setThicknesses] = useState<MaterialThickness[]>([]);
  const [finishTypes, setFinishTypes] = useState<AppOption[]>([]);
  const [frontTypes, setFrontTypes] = useState<AppOption[]>([]);
  const [bachaTypes, setBachaTypes] = useState<AppOption[]>([]);
  const [anafeTypes, setAnafeTypes] = useState<AppOption[]>([]);
  const [poolStock, setPoolStock] = useState<PoolStock[]>([]);

  const [clientId, setClientId] = useState(0);
  const [specs, setSpecs] = useState({ material: "", color: "", thickness: "", front: "", finish: "", bacha: "", anafe: "", perforations: "" });
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
  const [adicionales, setAdicionales] = useState<AdicionalRow[]>([]);
  const [currency, setCurrency] = useState("ARS");
  const [usdRate, setUsdRate] = useState(1000);
  const [discountPct, setDiscountPct] = useState(0);
  const [transport, setTransport] = useState(0);
  const [installation, setInstallation] = useState(0);
  const [depositReceived, setDepositReceived] = useState(0);
  const [depositCurrency, setDepositCurrency] = useState("ARS");
  const [installments, setInstallments] = useState(1);
  const [poolId, setPoolId] = useState(0);
  const [poolPrice, setPoolPrice] = useState(0);
  const [poolCurrency, setPoolCurrency] = useState("ARS");
  const [observations, setObservations] = useState({ design: "", important: "", notes: "", fabrication: "" });
  const [snapshot, setSnapshot] = useState({ name: "", phone: "", email: "", address: "" });
  const [payment, setPayment] = useState({ payment_method: "", validity_days: 15, estimated_delivery: "", estimated_date: "" });
  const [nextNumber, setNextNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [discountType, setDiscountType] = useState("porcentaje");
  const [cardSurchargePct, setCardSurchargePct] = useState(0);
  const [fabTab, setFabTab] = useState("ZÓCALO");
  const [saving, setSaving] = useState(false);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.total, 0), [items]);
  const subtotalAdicionales = useMemo(() => adicionales.reduce((s, a) => s + a.total, 0), [adicionales]);
  const subtotalTotal = subtotal + subtotalAdicionales;
  const discountAmt = discountType === "porcentaje" ? subtotalTotal * (discountPct / 100) : discountPct;
  const isCard = payment.payment_method?.toLowerCase().includes("tarjeta") || payment.payment_method === "card";
  const cardSurcharge = isCard ? (subtotalTotal - discountAmt) * (cardSurchargePct / 100) : 0;
  const totalArs = subtotalTotal - discountAmt + transport + installation + poolPrice + cardSurcharge;
  const totalUsd = usdRate > 0 ? totalArs / usdRate : 0;
  const balanceDue = totalArs - depositReceived;

  const handleMaterialChange = (value: string) => {
    setSpecs({ ...specs, material: value });
    const material = materials.find((m) => m.name === value);
    if (material && material.base_price > 0) {
      setItems((prev) => {
        const next = [...prev];
        if (next.length > 0 && !next[0].description) {
          next[0] = { ...next[0], unit_price: material.base_price, total: next[0].quantity * material.base_price, price_m2: material.base_price };
        }
        return next;
      });
    }
  };

  const handleClientChange = (id: number, c: Client | undefined) => {
    setClientId(id);
    if (c) {
      setClientName(c.name);
      setClientPhone(c.phone || "");
      setClientEmail(c.email || "");
      setClientAddress(c.address || "");
    }
  };

  const { loading: dataLoading, error: dataError, load: loadData } = useList(["budgetFormData"], async () => {
    const [cl, mat, col, thick, finish, front, bacha, anafe, ps] = await Promise.all([
      api.getClients(),
      api.getMaterials(),
      api.getColors(),
      api.getThicknesses(),
      api.getOptions("finish_type"),
      api.getOptions("front_type"),
      api.getOptions("bacha_type"),
      api.getOptions("anafe_type"),
      api.getPoolStock(),
    ]);
    setClients(cl);
    setMaterials(mat);
    setColors(col);
    setThicknesses(thick);
    setFinishTypes(finish);
    setFrontTypes(front);
    setBachaTypes(bacha);
    setAnafeTypes(anafe);
    setPoolStock(ps);
    if (!isEdit) {
      api.getNextBudgetNumber().then((res) => setNextNumber(res.number)).catch(() => {});
    }
    return [];
  });

  useGet(["budget", numId], () => api.getBudget(numId!).then((b: Budget) => {
    setClientId(b.client_id);
    setClientName(b.snapshot_name || "");
    setClientPhone(b.snapshot_phone || "");
    setClientEmail(b.snapshot_email || "");
    setClientAddress(b.snapshot_address || "");
    setSpecs({ material: b.material || "", color: b.color || "", thickness: b.thickness || "", front: b.front || "", finish: b.finish || "", bacha: b.bacha || "", anafe: b.anafe || "", perforations: b.perforations || "" });
    setItems(b.items.map((i) => ({ _key: key(), sector: i.sector || "", description: i.description, quantity: i.quantity, unit_price: i.unit_price, total: i.total, length: i.length, width: i.width, m2: i.m2, price_m2: i.price_m2 })));
    setAdicionales((b.adicionales || []).map((a) => ({ _key: key(), concept: a.concept || "", detail: a.detail || "", quantity: a.quantity, unit_price: a.unit_price, total: a.total })));
    setCurrency(b.currency);
    setUsdRate(b.usd_rate);
    setDiscountPct(b.discount);
    setTransport(b.transport);
    setInstallation(b.installation);
    setDepositReceived(b.deposit_received);
    setDepositCurrency(b.deposit_currency);
    setInstallments(b.installments);
    setPoolId(b.pool_id || 0);
    setPoolPrice(b.pool_price);
    setPoolCurrency(b.pool_currency);
    setObservations({ design: b.design_observations || "", important: b.important_observations || "", notes: b.notes || "", fabrication: b.fabrication_details || "" });
    setSnapshot({ name: b.snapshot_name || "", phone: b.snapshot_phone || "", email: b.snapshot_email || "", address: b.snapshot_address || "" });
    setPayment({ payment_method: b.payment_method || "", validity_days: b.validity_days, estimated_delivery: b.estimated_delivery || "", estimated_date: b.estimated_date || "" });
    return b;
  }), isEdit);

  const updateItem = (idx: number, field: keyof Omit<ItemRow, "_key">, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "length" || field === "width") {
        const l = field === "length" ? Number(value) : next[idx].length;
        const w = field === "width" ? Number(value) : next[idx].width;
        next[idx].m2 = Number(((l * w) / 10000).toFixed(4));
        next[idx].price_m2 = next[idx].unit_price > 0 && next[idx].m2 > 0 ? Number((next[idx].unit_price / next[idx].m2).toFixed(2)) : 0;
      }
      if (field === "price_m2" && next[idx].m2 > 0) {
        next[idx].unit_price = Number((next[idx].m2 * Number(value)).toFixed(2));
      }
      if (field === "unit_price" && next[idx].m2 > 0) {
        next[idx].price_m2 = Number((Number(value) / next[idx].m2).toFixed(2));
      }
      if (field === "quantity" || field === "unit_price") {
        next[idx].total = Number((next[idx].quantity * next[idx].unit_price).toFixed(2));
      }
      return next;
    });
  };

  const addItem = () => setItems([...items, emptyItem()]);

  const updateAdicional = (idx: number, field: keyof Omit<AdicionalRow, "_key">, value: string | number) => {
    setAdicionales((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "quantity" || field === "unit_price") {
        next[idx].total = Number((next[idx].quantity * next[idx].unit_price).toFixed(2));
      }
      return next;
    });
  };
  const addAdicional = () => setAdicionales([...adicionales, emptyAdicional()]);
  const removeAdicional = (idx: number) => setAdicionales(adicionales.filter((_, i) => i !== idx));

  const handlePoolChange = (id: number) => {
    setPoolId(id);
    const pool = poolStock.find((p) => p.id === id);
    if (pool) {
      setPoolPrice(pool.price);
      setPoolCurrency("ARS");
    } else {
      setPoolPrice(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId && !clientName) { notify("Seleccioná un cliente o ingresá un nombre", "error"); return; }
    setSaving(true);
    const payload: Record<string, unknown> = {
      ...(clientId > 0 ? { client_id: clientId } : {}),
      client_name: clientName || undefined,
      client_phone: clientPhone || undefined,
      client_email: clientEmail || undefined,
      client_address: clientAddress || undefined,
      ...specs,
      currency, usd_rate: usdRate,
      subtotal_materials: subtotal,
      subtotal_services: subtotalAdicionales,
      subtotal: subtotalTotal,
      transport, installation,
      discount: discountPct,
      discount_type: discountType,
      total: totalArs,
      total_usd: totalUsd,
      deposit_received: depositReceived,
      deposit_currency: depositCurrency,
      balance_due: balanceDue,
      payment_method: payment.payment_method,
      installments,
      validity_days: payment.validity_days,
      estimated_delivery: payment.estimated_delivery,
      estimated_date: payment.estimated_date,
      pool_id: poolId > 0 ? poolId : null,
      pool_price: poolPrice,
      pool_currency: poolCurrency,
      design_observations: observations.design,
      important_observations: observations.important,
      notes: observations.notes,
      fabrication_details: observations.fabrication,
      snapshot_name: snapshot.name,
      snapshot_phone: snapshot.phone,
      snapshot_email: snapshot.email,
      snapshot_address: snapshot.address,
      card_surcharge_pct: cardSurchargePct > 0 ? cardSurchargePct : undefined,
      items: items.filter((i) => i.description).map(({ _key: _, ...i }) => i),
      adicionales: adicionales.filter((a) => a.concept || a.detail).map(({ _key: _, ...a }) => a),
    };
    try {
      if (isEdit) {
        await api.updateBudget(Number(id), payload);
      } else {
        await api.createBudget(payload);
      }
      navigate("/admin/budgets");
    } catch {
      notify("Error al guardar el presupuesto", "error");
    } finally {
      setSaving(false);
    }
  };

  if (dataError && !dataLoading) {
    return (
      <div className={styles.budgetForm}>
        <h2 className={styles.budgetForm__title}>{isEdit ? "Editar Presupuesto" : "Nuevo Presupuesto"}</h2>
        {nextNumber && <span className={styles.budgetForm__nextNumber}>Próximo número: {nextNumber}</span>}
        <ErrorBlock message={dataError} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className={styles.budgetForm}>
      <h2 className={styles.budgetForm__title}>{isEdit ? "Editar Presupuesto" : "Nuevo Presupuesto"}</h2>
      {!isEdit && nextNumber && <span className={styles.budgetForm__nextNumber}>Próximo número: {nextNumber}</span>}
      <form className={styles.budgetForm__form} onSubmit={handleSubmit}>
        <BudgetFormClient
          clientId={clientId} clientName={clientName} clientPhone={clientPhone}
          clientEmail={clientEmail} clientAddress={clientAddress}
          clients={clients} dataLoading={dataLoading}
          onClientChange={handleClientChange}
          onNameChange={setClientName} onPhoneChange={setClientPhone}
          onEmailChange={setClientEmail} onAddressChange={setClientAddress}
        />

        <BudgetFormSpecs
          {...specs}
          materials={materials} colors={colors} thicknesses={thicknesses}
          frontTypes={frontTypes} finishTypes={finishTypes}
          bachaTypes={bachaTypes} anafeTypes={anafeTypes}
          dataLoading={dataLoading}
          onMaterialChange={handleMaterialChange}
          onChange={(field, v) => setSpecs({ ...specs, [field]: v })}
        />

        <BudgetFormItems
          items={items} fabTab={fabTab}
          onUpdate={updateItem} onAdd={addItem}
          onRemove={(key: number) => setItems(items.filter((i) => i._key !== key))}
          onFabTabChange={setFabTab}
          onSetItems={setItems}
          emptyItemFn={(sector) => emptyItem(sector)}
        />

        <BudgetFormAdicionales
          adicionales={adicionales}
          onUpdate={updateAdicional} onAdd={addAdicional} onRemove={removeAdicional}
        />

        <BudgetFormFinancial
          currency={currency} usdRate={usdRate} discountPct={discountPct}
          discountType={discountType} transport={transport} installation={installation}
          depositReceived={depositReceived} depositCurrency={depositCurrency}
          installments={installments} cardSurchargePct={cardSurchargePct}
          poolId={poolId} poolPrice={poolPrice} poolCurrency={poolCurrency}
          paymentMethod={payment.payment_method} validityDays={payment.validity_days}
          estimatedDelivery={payment.estimated_delivery} estimatedDate={payment.estimated_date}
          poolStock={poolStock} paymentMethods={paymentMethods}
          subtotalTotal={subtotalTotal} discountAmt={discountAmt}
          cardSurcharge={cardSurcharge} totalArs={totalArs} totalUsd={totalUsd} balanceDue={balanceDue}
          onCurrencyChange={setCurrency} onUsdRateChange={setUsdRate}
          onDiscountPctChange={setDiscountPct} onDiscountTypeChange={setDiscountType}
          onTransportChange={setTransport} onInstallationChange={setInstallation}
          onDepositReceivedChange={setDepositReceived} onDepositCurrencyChange={setDepositCurrency}
          onInstallmentsChange={setInstallments} onCardSurchargePctChange={setCardSurchargePct}
          onPoolIdChange={handlePoolChange} onPoolPriceChange={setPoolPrice} onPoolCurrencyChange={setPoolCurrency}
          onPaymentMethodChange={(v) => setPayment({ ...payment, payment_method: v })}
          onValidityDaysChange={(v) => setPayment({ ...payment, validity_days: v })}
          onEstimatedDeliveryChange={(v) => setPayment({ ...payment, estimated_delivery: v })}
          onEstimatedDateChange={(v) => setPayment({ ...payment, estimated_date: v })}
        />

        <BudgetFormObservations
          design={observations.design} important={observations.important}
          fabrication={observations.fabrication} notes={observations.notes}
          snapshotName={snapshot.name} snapshotPhone={snapshot.phone}
          snapshotEmail={snapshot.email} snapshotAddress={snapshot.address}
          onDesignChange={(v) => setObservations({ ...observations, design: v })}
          onImportantChange={(v) => setObservations({ ...observations, important: v })}
          onFabricationChange={(v) => setObservations({ ...observations, fabrication: v })}
          onNotesChange={(v) => setObservations({ ...observations, notes: v })}
          onSnapshotNameChange={(v) => setSnapshot({ ...snapshot, name: v })}
          onSnapshotPhoneChange={(v) => setSnapshot({ ...snapshot, phone: v })}
          onSnapshotEmailChange={(v) => setSnapshot({ ...snapshot, email: v })}
          onSnapshotAddressChange={(v) => setSnapshot({ ...snapshot, address: v })}
        />

        <FormActions loading={saving || dataLoading} />
      </form>
    </div>
  );
}
