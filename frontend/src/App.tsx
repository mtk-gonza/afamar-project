import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy } from "react";
import { Layout } from "./components/Layout/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute/ProtectedRoute";

const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard").then((m) => ({ default: m.Dashboard })));
const Budgets = lazy(() => import("./pages/Budgets/Budgets").then((m) => ({ default: m.Budgets })));
const BudgetForm = lazy(() => import("./pages/Budgets/BudgetForm").then((m) => ({ default: m.BudgetForm })));
const WorkOrders = lazy(() => import("./pages/WorkOrders/WorkOrders").then((m) => ({ default: m.WorkOrders })));
const WorkOrderForm = lazy(() => import("./pages/WorkOrders/WorkOrderForm").then((m) => ({ default: m.WorkOrderForm })));
const Clients = lazy(() => import("./pages/Clients/Clients").then((m) => ({ default: m.Clients })));
const ClientForm = lazy(() => import("./pages/Clients/ClientForm").then((m) => ({ default: m.ClientForm })));
const Materials = lazy(() => import("./pages/Materials/Materials").then((m) => ({ default: m.Materials })));
const MaterialForm = lazy(() => import("./pages/Materials/MaterialForm").then((m) => ({ default: m.MaterialForm })));
const MaterialConsultant = lazy(() => import("./pages/Materials/MaterialConsultant").then((m) => ({ default: m.MaterialConsultant })));
const PoolStock = lazy(() => import("./pages/PoolStock/PoolStock").then((m) => ({ default: m.PoolStock })));
const PoolStockForm = lazy(() => import("./pages/PoolStock/PoolStockForm").then((m) => ({ default: m.PoolStockForm })));
const Reports = lazy(() => import("./pages/Reports/Reports").then((m) => ({ default: m.Reports })));
const Settings = lazy(() => import("./pages/Settings/Settings").then((m) => ({ default: m.Settings })));
const Measurements = lazy(() => import("./pages/Measurements/Measurements").then((m) => ({ default: m.Measurements })));
const OnlineBudgets = lazy(() => import("./pages/OnlineBudgets/OnlineBudgets").then((m) => ({ default: m.OnlineBudgets })));
const OnlineBudgetForm = lazy(() => import("./pages/OnlineBudgets/OnlineBudgetForm").then((m) => ({ default: m.OnlineBudgetForm })));
const Calculator = lazy(() => import("./pages/Calculator/Calculator").then((m) => ({ default: m.Calculator })));
const DailyCashPage = lazy(() => import("./pages/DailyCash/DailyCashPage").then((m) => ({ default: m.DailyCashPage })));
const CashHistory = lazy(() => import("./pages/DailyCash/CashHistory").then((m) => ({ default: m.CashHistory })));
const Login = lazy(() => import("./pages/Login/Login").then((m) => ({ default: m.Login })));
const Public = lazy(() => import("./pages/Public/Public").then((m) => ({ default: m.Public })));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Public />} />
        <Route path="login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="admin" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="budgets" element={<Budgets />} />
            <Route path="budgets/new" element={<BudgetForm />} />
            <Route path="budgets/:id/edit" element={<BudgetForm />} />
            <Route path="work-orders" element={<WorkOrders />} />
            <Route path="work-orders/new" element={<WorkOrderForm />} />
            <Route path="work-orders/:id/edit" element={<WorkOrderForm />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/new" element={<ClientForm />} />
            <Route path="clients/:id/edit" element={<ClientForm />} />
            <Route path="materials" element={<Materials />} />
            <Route path="materials/new" element={<MaterialForm />} />
            <Route path="materials/:id/edit" element={<MaterialForm />} />
            <Route path="material-consultant" element={<MaterialConsultant />} />
            <Route path="pool-stock" element={<PoolStock />} />
            <Route path="pool-stock/new" element={<PoolStockForm />} />
            <Route path="pool-stock/:id/edit" element={<PoolStockForm />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="measurements" element={<Measurements />} />
            <Route path="online-budgets" element={<OnlineBudgets />} />
            <Route path="online-budgets/new" element={<OnlineBudgetForm />} />
            <Route path="online-budgets/:id/edit" element={<OnlineBudgetForm />} />
            <Route path="calculator" element={<Calculator />} />
            <Route path="cash" element={<DailyCashPage />} />
            <Route path="cash/history" element={<CashHistory />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
