import { authApi } from "./auth";
import { clientsApi } from "./clients";
import { budgetsApi } from "./budgets";
import { workOrdersApi } from "./workOrders";
import { materialsApi } from "./materials";
import { poolStockApi } from "./poolStock";
import { optionsApi } from "./options";
import { settingsApi } from "./settings";
import { measurementsApi } from "./measurements";
import { onlineBudgetsApi } from "./onlineBudgets";
import { reportsApi } from "./reports";
import { searchApi } from "./search";
import { whatsappApi } from "./whatsapp";

export const api = {
  // Auth
  login: authApi.login,
  me: authApi.me,
  register: authApi.register,
  // Clients
  getClients: clientsApi.list,
  getClient: clientsApi.get,
  searchClients: clientsApi.search,
  createClient: clientsApi.create,
  updateClient: clientsApi.update,
  deleteClient: clientsApi.delete,

  // Budgets
  getBudgets: budgetsApi.list,
  getBudget: budgetsApi.get,
  searchBudgets: budgetsApi.search,
  createBudget: budgetsApi.create,
  updateBudget: budgetsApi.update,
  deleteBudget: budgetsApi.delete,
  downloadBudgetPdf: budgetsApi.downloadPdf,
  sendBudgetEmail: budgetsApi.sendEmail,
  sendBudgetWhatsApp: whatsappApi.sendBudget,

  // Work Orders
  getWorkOrders: workOrdersApi.list,
  getWorkOrder: workOrdersApi.get,
  searchWorkOrders: workOrdersApi.search,
  createWorkOrder: workOrdersApi.create,
  createFromBudget: workOrdersApi.createFromBudget,
  updateWorkOrder: workOrdersApi.update,
  deleteWorkOrder: workOrdersApi.delete,

  // Materials
  getCategories: materialsApi.categories.list,
  createCategory: materialsApi.categories.create,
  deleteCategory: materialsApi.categories.delete,
  getColors: materialsApi.colors.list,
  createColor: materialsApi.colors.create,
  deleteColor: materialsApi.colors.delete,
  getThicknesses: materialsApi.thicknesses.list,
  createThickness: materialsApi.thicknesses.create,
  deleteThickness: materialsApi.thicknesses.delete,
  getMaterials: materialsApi.list,
  getMaterial: materialsApi.get,
  createMaterial: materialsApi.create,
  updateMaterial: materialsApi.update,
  deleteMaterial: materialsApi.delete,
  getPriceHistory: materialsApi.priceHistory,

  // Pool Stock
  getPoolStock: poolStockApi.list,
  getPoolStockById: poolStockApi.get,
  searchPoolStock: poolStockApi.search,
  createPoolStock: poolStockApi.create,
  updatePoolStock: poolStockApi.update,
  deletePoolStock: poolStockApi.delete,
  addStockMovement: poolStockApi.addMovement,

  // App Options
  getOptions: optionsApi.list,
  createOption: optionsApi.create,
  deleteOption: optionsApi.delete,

  // Settings
  getSettings: settingsApi.get,
  updateSettings: settingsApi.update,

  // Measurements
  getMeasurements: measurementsApi.list,
  getMeasurement: measurementsApi.get,
  createMeasurement: measurementsApi.create,
  updateMeasurement: measurementsApi.update,
  deleteMeasurement: measurementsApi.delete,

  // Online Budgets
  getOnlineBudgets: onlineBudgetsApi.list,
  getOnlineBudget: onlineBudgetsApi.get,
  createOnlineBudget: onlineBudgetsApi.create,
  updateOnlineBudget: onlineBudgetsApi.update,
  deleteOnlineBudget: onlineBudgetsApi.delete,

  // Search
  search: searchApi.all,

  // Reports
  getDashboard: reportsApi.dashboard,
  getBudgetsByStatus: reportsApi.budgetsByStatus,
  getWorkOrdersByStatus: reportsApi.workOrdersByStatus,
  getMonthlySales: reportsApi.monthlySales,
  getMostUsedMaterials: reportsApi.mostUsedMaterials,
};
