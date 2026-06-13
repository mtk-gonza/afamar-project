import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout/Layout";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { Budgets } from "./pages/Budgets/Budgets";
import { BudgetForm } from "./pages/Budgets/BudgetForm";
import { WorkOrders } from "./pages/WorkOrders/WorkOrders";
import { WorkOrderForm } from "./pages/WorkOrders/WorkOrderForm";
import { Clients } from "./pages/Clients/Clients";
import { ClientForm } from "./pages/Clients/ClientForm";
import { Materials } from "./pages/Materials/Materials";
import { MaterialForm } from "./pages/Materials/MaterialForm";
import { PoolStock } from "./pages/PoolStock/PoolStock";
import { PoolStockForm } from "./pages/PoolStock/PoolStockForm";
import { Reports } from "./pages/Reports/Reports";
import { Settings } from "./pages/Settings/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
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
          <Route path="pool-stock" element={<PoolStock />} />
          <Route path="pool-stock/new" element={<PoolStockForm />} />
          <Route path="pool-stock/:id/edit" element={<PoolStockForm />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
